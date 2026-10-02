import { logout, requestPasswordReset } from "@/lib/actions/auth";
import { changeEmail, changePassword, deleteAccount } from "@/lib/actions/account";
import { hasFreshEmailSignIn } from "@/lib/auth/password";
import { db } from "@/lib/supabase/db";
import { InputField } from "@/components/ui/input-field";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { errorMessage, noticeMessage } from "@/lib/url-messages";

export const metadata = {
  title: "Account",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error: errorCode, message: messageCode } = await searchParams;
  const error = errorMessage(errorCode);
  const message = noticeMessage(messageCode);
  const { supabase, user } = await db();

  // A sign-in by emailed code in the last 10 minutes (a password reset) can
  // set a password or change the email without the current password;
  // otherwise the current one is asked for (confirmIdentity() in
  // src/lib/actions/account.ts).
  const needsCurrentPassword = !(await hasFreshEmailSignIn(supabase));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Account</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm">{message}</p> : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Email</h2>
          <form action={changeEmail} className="flex flex-col gap-2">
            <InputField
              name="email"
              type="email"
              leftIcon="mdi:email-outline"
              placeholder="New email"
              autoComplete="email"
              required
            />
            {needsCurrentPassword ? (
              <PasswordInputField name="current" placeholder="Current password" autoComplete="current-password" required />
            ) : null}
            <p className="text-xs text-muted-foreground">
              We&apos;ll email a confirmation link to the new address. It changes once you click it, in this browser.
            </p>
            <SubmitButton variant="secondary" className="self-start">
              Change email
            </SubmitButton>
          </form>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Password</h2>
          <form action={changePassword} className="flex flex-col gap-2">
            {needsCurrentPassword ? (
              <PasswordInputField name="current" placeholder="Current password" autoComplete="current-password" required />
            ) : (
              <p className="text-xs text-muted-foreground">
                You just signed in with an emailed code, so you can set a new password without your current one.
              </p>
            )}
            <PasswordInputField name="password" placeholder="New password" autoComplete="new-password" minLength={8} required />
            <PasswordInputField
              name="confirm"
              placeholder="Confirm new password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <SubmitButton variant="secondary" className="self-start">
              Change password
            </SubmitButton>
          </form>
          {needsCurrentPassword ? (
            <form action={requestPasswordReset}>
              <input type="hidden" name="email" value={user.email ?? ""} />
              <SubmitButton variant="secondary" className="h-7 px-2.5 text-xs">
                Forgot your current password? Email me a code
              </SubmitButton>
            </form>
          ) : null}
        </div>

        <form action={logout}>
          <SubmitButton variant="secondary">Log out</SubmitButton>
        </form>

        <div className="flex flex-col gap-3 border-t border-secondary pt-8">
          <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account and everything in it. This can&apos;t be undone.
          </p>
          <form action={deleteAccount} className="flex flex-col gap-2">
            <InputField
              name="confirmation"
              type="email"
              placeholder={`Type "${user.email ?? "your email"}" to confirm`}
              required
              autoComplete="off"
            />
            <SubmitButton variant="destructive" className="self-start">
              Delete account
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
