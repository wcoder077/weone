"use client";

import { useActionState, useState, type FormEvent } from "react";
import { ResendConfirmation } from "./resend-confirmation";
import { useKeepValuesSubmit } from "./use-keep-values-submit";
import { signUp } from "@/lib/actions/auth";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/i18n-provider";

export function SignupForm() {
  const t = useT();
  const [state, action, pending] = useActionState(signUp, null);
  const submit = useKeepValuesSubmit(action);
  const [email, setEmail] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const value = new FormData(event.currentTarget).get("email");
    setEmail(typeof value === "string" ? value.trim() : "");
    submit(event);
  }

  // Confirmation email sent: tell where it went and offer to send it again.
  if (state?.message) {
    return (
      <div className="flex flex-col gap-3">
        <FormMessage message={state.message} />
        <ResendConfirmation email={email} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="full_name" label={t("Ism va familiya")} errors={state?.fieldErrors?.full_name}>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          aria-describedby="full_name-desc"
          aria-invalid={Boolean(state?.fieldErrors?.full_name)}
        />
      </FormField>
      <FormField id="email" label={t("Email")} errors={state?.fieldErrors?.email}>
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
      <FormField
        id="password"
        label={t("Parol")}
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
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? t("Yaratilmoqda…") : t("Hisob yaratish")}
      </Button>
    </form>
  );
}
