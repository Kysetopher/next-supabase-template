import Link from "next/link";

import { login } from "@/lib/actions/auth";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { errorMessage, noticeMessage } from "@/lib/url-messages";

export const metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const notice = noticeMessage(message);

  return (
    <>
      <h1 className="text-lg font-semibold">Log in</h1>

      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

      <CredentialsForm action={login} submitLabel="Log in" error={errorMessage(error) ?? undefined} />

      <p className="-mt-3 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-primary underline-offset-2 hover:underline">
          Forgot password?
        </Link>
      </p>

      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-primary underline-offset-2 hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
