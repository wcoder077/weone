"use client";

import { useActionState } from "react";
import { useKeepValuesSubmit } from "./use-keep-values-submit";
import { updatePassword } from "@/lib/actions/auth";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/i18n-provider";

export function ResetPasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState(updatePassword, null);
  const onSubmit = useKeepValuesSubmit(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        id="password"
        label={t("Yangi parol")}
        hint={t("Kamida 8 ta belgi")}
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
      <FormField id="confirm" label={t("Parolni takrorlang")} errors={state?.fieldErrors?.confirm}>
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
        {pending ? t("Saqlanmoqda…") : t("Parolni saqlash")}
      </Button>
    </form>
  );
}
