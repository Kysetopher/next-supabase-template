import Link from "next/link";

import { requestPasswordReset, resetPassword } from "@/lib/actions/auth";
import { InputField } from "@/components/ui/input-field";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { displayEmail, errorMessage } from "@/lib/url-messages";

export const metadata = {
  title: "Set a new password",
};

/**
 * Step 2 of a password reset. Supabase's default email carries a link, which
 * lands on /auth/recovery instead; with the Reset Password template edited to
 * show `{{ .Token }}`, it carries a code, entered here with the new password
 * (resetPassword()). Shown the same way whether or not the email has an
 * account, so it can't reveal who's registered. Without a valid `?email=`
 * there's nothing to verify against, so it sends the user back a step.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const params = await searchParams;
  const email = displayEmail(params.email);
  const error = errorMessage(params.error);

  if (!email) {
    return (
      <>
        <h1 className="text-lg font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t tell which email to check.{" "}
          <Link href="/forgot-password" className="text-primary underline-offset-2 hover:underline">
            Get a new code
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          If <span className="text-foreground">{email}</span> has an account, we sent it an email. If it has a{" "}
          <strong className="text-foreground">link</strong>, open it in this browser and you can set a new password straight away. If
          it has a <strong className="text-foreground">6-digit code</strong>, enter it below — that works on any device.
        </p>
      </div>

      <form action={resetPassword} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <InputField
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,12}"
          maxLength={12}
          placeholder="6-digit code"
          aria-label="Reset code"
          required
        />
        <PasswordInputField
          name="password"
          placeholder="New password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <PasswordInputField
          name="confirm"
          placeholder="Confirm new password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <SubmitButton>Set password and log in</SubmitButton>
      </form>

      <form action={requestPasswordReset}>
        <input type="hidden" name="email" value={email} />
        <SubmitButton variant="secondary" className="h-7 px-2.5 text-xs">
          Send a new code
        </SubmitButton>
      </form>
    </>
  );
}
