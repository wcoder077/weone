"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField
        id="password"
        label="Yangi parol"
        hint="Kamida 8 ta belgi"
        errors={state?.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby="password-desc"
          aria-invalid={Boolean(state?.fieldErrors?.password)}
        />
      </FormField>
      <FormField id="confirm" label="Parolni takrorlang" errors={state?.fieldErrors?.confirm}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby="confirm-desc"
          aria-invalid={Boolean(state?.fieldErrors?.confirm)}
        />
      </FormField>
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Saqlanmoqda…" : "Parolni saqlash"}
      </Button>
    </form>
  );
}
