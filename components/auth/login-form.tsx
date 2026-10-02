"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { ResendConfirmation } from "./resend-confirmation";
import { EMAIL_NOT_CONFIRMED } from "@/lib/auth-messages";
import { useKeepValuesSubmit } from "./use-keep-values-submit";
import { signIn } from "@/lib/actions/auth";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  const submit = useKeepValuesSubmit(action);
  const [email, setEmail] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const value = new FormData(event.currentTarget).get("email");
    setEmail(typeof value === "string" ? value.trim() : "");
    submit(event);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
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
        <FormField
          id="password"
          label="Parol"
          errors={state?.fieldErrors?.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby="password-desc"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
          />
        </FormField>
        <Link
          href="/forgot-password"
          className="text-muted hover:text-text -mt-2 self-end py-2 text-[14px] underline-offset-4 hover:underline"
        >
          Parolni unutdingizmi?
        </Link>
        <FormMessage error={state?.error} />
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? "Kirilmoqda…" : "Kirish"}
        </Button>
      </form>
      {state?.error === EMAIL_NOT_CONFIRMED ? (
        <ResendConfirmation email={email} />
      ) : null}
    </div>
  );
}
