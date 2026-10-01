"use client";

import { useActionState } from "react";
import { useKeepValuesSubmit } from "./use-keep-values-submit";
import { requestPasswordReset } from "@/lib/actions/auth";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  const onSubmit = useKeepValuesSubmit(action);

  // Sent: hide the form so the same email isn't requested again right away.
  if (state?.message) return <FormMessage message={state.message} />;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="email" label="Email" errors={state?.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby="email-desc"
          aria-invalid={Boolean(state?.fieldErrors?.email)}
        />
      </FormField>
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Yuborilmoqda…" : "Havolani yuborish"}
      </Button>
    </form>
  );
}
