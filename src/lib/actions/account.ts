"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/supabase/db";
import { env, isBillingEnabled } from "@/lib/env";
import { deleteStripeCustomer, getStripeCustomerId } from "@/lib/billing/customers";
import { createServiceClient } from "@/lib/supabase/service";
import { checkBurst } from "@/lib/rate-limit/burst";
import { allowEmailSend, normalizeEmail } from "@/lib/auth/email-limits";
import { hasFreshEmailSignIn } from "@/lib/auth/password";
import { authErrorCode, errorParam, type ErrorCode } from "@/lib/url-messages";

type Supabase = Awaited<ReturnType<typeof db>>["supabase"];

/**
 * Re-checks who's at the keyboard before a password or email change: the
 * current password, or a sign-in by emailed code in the last 10 minutes
 * (hasFreshEmailSignIn()). A session left open or stolen shouldn't be enough
 * to lock the owner out. Returns an error code, or null if confirmed.
 *
 * The password check is a real sign-in, limited per account (not per IP) so
 * guesses can't be spread across addresses; it replaces the session with an
 * identical new one for the same user.
 */
async function confirmIdentity(supabase: Supabase, userId: string, email: string, current: FormDataEntryValue | null): Promise<ErrorCode | null> {
  if (typeof current === "string" && current) {
    if (!(await checkBurst("auth", `reauth:${userId}`))) return "too_many_attempts";
    const { error } = await supabase.auth.signInWithPassword({ email, password: current });
    if (!error) return null;
    return error.code === "invalid_credentials" ? "current_password_wrong" : authErrorCode(error, "password_update_failed");
  }
  return (await hasFreshEmailSignIn(supabase)) ? null : "current_password_required";
}

/** Change (or, right after an emailed reset code, set) the password from /account. See confirmIdentity() for what's asked first. */
export async function changePassword(formData: FormData) {
  const { supabase, user } = await db();
  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    redirect(`/account?${errorParam("password_required")}`);
  }
  if (password !== formData.get("confirm")) {
    redirect(`/account?${errorParam("password_mismatch")}`);
  }
  if (!user.email) {
    redirect(`/account?${errorParam("account_load_failed")}`);
  }

  const identityError = await confirmIdentity(supabase, user.id, user.email, formData.get("current"));
  if (identityError) {
    redirect(`/account?${errorParam(identityError)}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/account?${errorParam(authErrorCode(error, "password_update_failed"))}`);
  }

  redirect("/account?message=password_updated");
}

/**
 * Starts an email change. Supabase emails a confirmation link to the new
 * address (and, with "Secure email change" on, to the current one too); the
 * change happens once the link(s) land on /auth/email-change.
 *
 * Identity is always confirmed first (confirmIdentity()). The per-email send
 * limit applies to the new address, so this can't be used to flood someone
 * else's inbox.
 */
export async function changeEmail(formData: FormData) {
  const { supabase, user } = await db();
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    redirect(`/account?${errorParam("invalid_email")}`);
  }
  if (!user.email || email === user.email.toLowerCase()) {
    redirect(`/account?${errorParam("email_unchanged")}`);
  }

  const identityError = await confirmIdentity(supabase, user.id, user.email, formData.get("current"));
  if (identityError) {
    redirect(`/account?${errorParam(identityError)}`);
  }

  if (!(await checkBurst("auth", `email-change:${user.id}`)) || !(await allowEmailSend(email))) {
    redirect(`/account?${errorParam("too_many_attempts")}`);
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${env.SITE_URL}/auth/email-change` }
  );
  if (error) {
    redirect(`/account?${errorParam(authErrorCode(error, "email_change_failed"))}`);
  }

  redirect("/account?message=email_change_sent");
}

/**
 * Removes every file directly under `<bucket>/<userId>/`. True once none are
 * left. Flat folders only (sub-folders are listed with a null id and skipped)
 * — recurse here if a bucket ever nests deeper. Add a call per user-owned
 * bucket.
 */
async function deleteUserFiles(service: ReturnType<typeof createServiceClient>, bucket: string, userId: string): Promise<boolean> {
  const storage = service.storage.from(bucket);
  // Bounded so a remove that reports success but leaves files can't spin forever.
  for (let pass = 0; pass < 50; pass++) {
    const { data, error: listError } = await storage.list(userId, { limit: 1000 });
    if (listError) {
      console.error("deleteAccount: storage list failed", bucket, userId, listError);
      return false;
    }
    const files = data.filter((entry) => entry.id !== null);
    if (!files.length) return true;

    const { error: removeError } = await storage.remove(files.map((file) => `${userId}/${file.name}`));
    if (removeError) {
      console.error("deleteAccount: storage remove failed", bucket, userId, removeError);
      return false;
    }
  }
  console.error("deleteAccount: storage files remained after repeated removes", bucket, userId);
  return false;
}

/**
 * Permanently deletes the caller's own account by deleting their
 * `auth.users` row. Any app table keyed on the user should reference
 * `auth.users(id) on delete cascade` so this tears down their data with it.
 * Clean up anything outside Postgres (billing customers, storage objects)
 * before the delete below, and block the delete if that fails.
 *
 * Requires typing the account's own email as confirmation — both because
 * this is irreversible, and because a Server Action's `formData` can be
 * posted from anywhere, not just this form; re-checking against the
 * session's own email (never trusting a client-supplied identity) is what
 * makes that confirmation actually mean something.
 */
export async function deleteAccount(formData: FormData) {
  const { user } = await db();

  const confirmation = formData.get("confirmation");
  if (
    typeof confirmation !== "string" ||
    !user.email ||
    confirmation.trim().toLowerCase() !== user.email.toLowerCase()
  ) {
    redirect(`/account?${errorParam("delete_confirm_mismatch")}`);
  }

  // Service client: deleting an auth.users row goes through Supabase's Admin
  // API, which requires the secret key by design. What keeps this safe is
  // that `user.id` came from the session verified moments earlier via db(),
  // not from form input — this can only ever delete the caller's own account.
  const service = createServiceClient();

  // Storage objects don't cascade from auth.users, so the user's files go
  // first. A failure blocks the delete: proceeding would orphan their files
  // with no account left to reach them by.
  if (!(await deleteUserFiles(service, "avatars", user.id))) {
    redirect(`/account?${errorParam("delete_failed")}`);
  }

  // The Stripe customer doesn't cascade either. Deleting it cancels their
  // subscriptions at once, so nothing is charged after the account is gone.
  // Already gone ("resource_missing", e.g. a retried deletion) counts as
  // done; any other failure blocks the delete, like the files above. Only
  // checked with billing on — turning billing off after customers exist
  // means deleting them in Stripe yourself (docs/STRIPE.md).
  if (isBillingEnabled()) {
    let customerId: string | null;
    try {
      customerId = await getStripeCustomerId(service, user.id);
    } catch (error) {
      console.error("deleteAccount: billing customer lookup failed", user.id, error);
      redirect(`/account?${errorParam("delete_failed")}`);
    }
    if (customerId && !(await deleteStripeCustomer(customerId))) {
      redirect(`/account?${errorParam("delete_failed")}`);
    }
  }

  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("deleteAccount: auth user deletion failed", user.id, deleteError);
    redirect(`/account?${errorParam("delete_failed")}`);
  }

  redirect("/login?message=account_deleted");
}
