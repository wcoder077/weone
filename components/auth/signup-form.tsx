"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);

  if (state?.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField id="full_name" label="Ism va familiya" errors={state?.fieldErrors?.full_name}>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          defaultValue={state?.values?.full_name}
          required
          aria-describedby="full_name-desc"
          aria-invalid={Boolean(state?.fieldErrors?.full_name)}
        />
      </FormField>
      <FormField id="email" label="Email" errors={state?.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          required
          aria-describedby="email-desc"
          aria-invalid={Boolean(state?.fieldErrors?.email)}
        />
      </FormField>
      <FormField
        id="password"
        label="Parol"
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
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Yaratilmoqda…" : "Hisob yaratish"}
      </Button>
    </form>
  );
}
