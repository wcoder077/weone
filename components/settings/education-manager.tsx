"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { addEducation, deleteEducation } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/i18n-provider";

type Education = {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  start_year: number | null;
  end_year: number | null;
};

export function EducationManager({ education }: { education: Education[] }) {
  const t = useT();
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await addEducation(prev, formData);
    if (result?.message) setFormKey((k) => k + 1);
    return result;
  }, null);
  const errors = state?.fieldErrors;

  return (
    <div className="flex flex-col gap-5">
      {education.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {education.map((e) => (
            <EducationRow key={e.id} education={e} />
          ))}
        </ul>
      ) : null}

      <form key={formKey} action={action} className="border-border flex flex-col gap-4 rounded-2xl border p-4" noValidate>
        <FormField id="institution" label={t("Muassasa")} errors={errors?.institution}>
          <Input id="institution" name="institution" maxLength={120} aria-describedby="institution-desc" />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="degree" label={t("Daraja")} errors={errors?.degree}>
            <Input id="degree" name="degree" maxLength={80} placeholder={t("Bakalavr")} />
          </FormField>
          <FormField id="field" label={t("Yo'nalish")} errors={errors?.field}>
            <Input id="field" name="field" maxLength={80} />
          </FormField>
          <FormField id="start_year" label={t("Boshlangan yil")} errors={errors?.start_year}>
            <Input id="start_year" name="start_year" inputMode="numeric" maxLength={4} aria-describedby="start_year-desc" />
          </FormField>
          <FormField id="end_year" label={t("Tugash yili")} errors={errors?.end_year}>
            <Input id="end_year" name="end_year" inputMode="numeric" maxLength={4} aria-describedby="end_year-desc" />
          </FormField>
        </div>
        <FormMessage error={state?.error} />
        <Button type="submit" variant="outline" disabled={pending} className="sm:self-start">
          {pending ? t("Qo'shilmoqda…") : t("Ta'lim qo'shish")}
        </Button>
      </form>
    </div>
  );
}

function EducationRow({ education: e }: { education: Education }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{e.institution}</span>
        <span className="text-muted text-[14px]">
          {[e.degree, e.field].filter(Boolean).join(" · ")}
          {e.start_year ? ` · ${e.start_year}–${e.end_year ?? t("hozir")}` : ""}
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("{institution} — o'chirish", { institution: e.institution })}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteEducation(e.id);
            if (result?.error) toast.error(result.error);
          })
        }
      >
        <Trash2 />
      </Button>
    </li>
  );
}
