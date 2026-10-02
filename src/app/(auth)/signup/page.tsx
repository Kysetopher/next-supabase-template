import Link from "next/link";

import { signup } from "@/lib/actions/auth";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { errorMessage } from "@/lib/url-messages";

export const metadata = {
  title: "Sign up",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-lg font-semibold">Create account</h1>

      <CredentialsForm
        action={signup}
        submitLabel="Create account"
        error={errorMessage(error) ?? undefined}
      />

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
