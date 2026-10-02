"use client";

import { useActionState } from "react";
import { useKeepValuesSubmit } from "./use-keep-values-submit";
import { resendConfirmation } from "@/lib/actions/auth";
import { FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

// "Send the confirmation email again" for an account that is not confirmed yet.
export function ResendConfirmation({ email }: { email: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(resendConfirmation, null);
  const onSubmit = useKeepValuesSubmit(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />
      <FormMessage error={state?.error ?? state?.fieldErrors?.email?.[0]} message={state?.message} />
      {state?.message ? null : (
        <Button type="submit" variant="outline" size="lg" disabled={pending || !email} aria-busy={pending}>
          {pending ? t("Yuborilmoqda…") : t("Xatni qayta yuborish")}
        </Button>
      )}
    </form>
  );
}
