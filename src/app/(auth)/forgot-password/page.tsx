import Link from "next/link";

import { requestPasswordReset } from "@/lib/actions/auth";
import { InputField } from "@/components/ui/input-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { displayEmail, errorMessage } from "@/lib/url-messages";

export const metadata = {
  title: "Reset your password",
};

/**
 * Step 1 of a password reset: ask for the email and send a 6-digit code
 * (requestPasswordReset()).
 */
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const params = await searchParams;
  const email = displayEmail(params.email);
  const error = errorMessage(params.error);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a 6-digit code to set a new password.
        </p>
      </div>

      <form action={requestPasswordReset} className="flex flex-col gap-3">
        <InputField
          name="email"
          type="email"
          leftIcon="mdi:email-outline"
          placeholder="Email"
          defaultValue={email ?? undefined}
          autoComplete="email"
          required
        />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <SubmitButton>Email me a code</SubmitButton>
      </form>

      <p className="text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-primary underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
