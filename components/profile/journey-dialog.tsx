"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { saveJourneyItem } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import { JOURNEY_TYPES } from "@/lib/constants";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { ToggleChip } from "@/components/shared/skill-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/i18n/i18n-provider";

export type EditableJourneyItem = {
  id: string;
  type: string;
  title: string;
  organization: string | null;
  role: string | null;
  result: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  skill_ids: string[];
};

type Props = {
  mySkills: { id: string; name: string }[];
  item?: EditableJourneyItem;
};

export function JourneyDialog({ mySkills, item }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      {item ? (
        <Button variant="ghost" size="icon" aria-label={t("{title} — tahrirlash", { title: item.title })} onClick={() => setOpen(true)}>
          <Pencil />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          {t("Qo'shish")}</Button>
      )}
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setFormKey((k) => k + 1);
        }}
        title={item ? t("Yo'lni tahrirlash") : t("Yo'lga qo'shish")}
        description={t("Hackathon, ish, kurs yoki loyiha — qilgan ishingizni ko'rsating.")}
      >
        <JourneyForm key={formKey} mySkills={mySkills} item={item} onSaved={() => setOpen(false)} />
      </ResponsiveDialog>
    </>
  );
}

function JourneyForm({ mySkills, item, onSaved }: Props & { onSaved: () => void }) {
  const t = useT();
  const [skillIds, setSkillIds] = useState(() => new Set(item?.skill_ids ?? []));
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await saveJourneyItem(prev, formData);
    if (result?.message) onSaved();
    return result;
  }, null);
  const errors = state?.fieldErrors;

  function toggleSkill(id: string) {
    setSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      {[...skillIds].map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}

      <FormField id="type" label={t("Turi")} errors={errors?.type}>
        <NativeSelect id="type" name="type" defaultValue={item?.type ?? "hackathon"}>
          {JOURNEY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {t(type.label)}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="title" label={t("Nomi")} errors={errors?.title}>
        <Input id="title" name="title" maxLength={120} defaultValue={item?.title} aria-describedby="title-desc" />
      </FormField>
      <FormField
        id="organization"
        label={t("Tashkilot")}
        hint={t("Tasdiqlash uchun nom va tashkilot boshqa ishtirokchilarniki bilan bir xil bo'lsin.")}
        errors={errors?.organization}
      >
        <Input id="organization" name="organization" maxLength={120} defaultValue={item?.organization ?? ""} aria-describedby="organization-desc" />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="role" label={t("Rolingiz")} errors={errors?.role}>
          <Input id="role" name="role" maxLength={80} defaultValue={item?.role ?? ""} />
        </FormField>
        <FormField id="result" label={t("Natija")} hint={t("Masalan: G'olib, Finalchi")} errors={errors?.result}>
          <Input id="result" name="result" maxLength={80} defaultValue={item?.result ?? ""} aria-describedby="result-desc" />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="start_date" label={t("Boshlanish")} errors={errors?.start_date}>
          <Input id="start_date" name="start_date" type="month" defaultValue={item?.start_date?.slice(0, 7) ?? ""} />
        </FormField>
        <FormField id="end_date" label={t("Tugash")} hint={t("Davom etsa bo'sh qoldiring")} errors={errors?.end_date}>
          <Input id="end_date" name="end_date" type="month" defaultValue={item?.end_date?.slice(0, 7) ?? ""} aria-describedby="end_date-desc" />
        </FormField>
      </div>
      {mySkills.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("Qaysi ko'nikmalarni ishlatdingiz?")}</legend>
          <div className="flex flex-wrap gap-2">
            {mySkills.map((skill) => (
              <ToggleChip key={skill.id} selected={skillIds.has(skill.id)} onClick={() => toggleSkill(skill.id)}>
                {skill.name}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      ) : null}
      <FormField id="description" label={t("Tavsif")} errors={errors?.description}>
        <Textarea id="description" name="description" maxLength={1000} defaultValue={item?.description ?? ""} />
      </FormField>
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("Saqlanmoqda…") : t("Saqlash")}
      </Button>
    </form>
  );
}
