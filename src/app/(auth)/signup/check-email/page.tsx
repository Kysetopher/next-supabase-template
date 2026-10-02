import Link from "next/link";
import { displayEmail } from "@/lib/url-messages";

export const metadata = {
  title: "Check your email",
};

/**
 * Where signup() lands when "Confirm email" is on — the confirmation link
 * goes to /auth/callback, which exchanges it for a session (PKCE, so it has
 * to be opened in the same browser the signup happened in).
 */
export default async function SignupCheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const email = displayEmail((await searchParams).email);

  return (
    <>
      <h1 className="text-lg font-semibold">Check your email</h1>

      <p className="text-sm text-muted-foreground">
        {email ? (
          <>
            We sent a confirmation link to <span className="text-foreground">{email}</span>.
          </>
        ) : (
          "We sent you a confirmation link."
        )}{" "}
        Open it in this browser to finish creating your account.
      </p>

      <p className="text-sm text-muted-foreground">
        Already confirmed?{" "}
        <Link href="/login" className="text-primary underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
