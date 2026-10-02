import { InputField } from "@/components/ui/input-field";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function CredentialsForm({
  action,
  submitLabel,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  error?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <InputField
        name="email"
        type="email"
        leftIcon="mdi:email-outline"
        placeholder="Email"
        required
      />
      <PasswordInputField
        name="password"
        placeholder="Password"
        autoComplete="current-password"
        required
      />
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
