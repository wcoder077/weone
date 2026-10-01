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
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      {item ? (
        <Button variant="ghost" size="icon" aria-label={`${item.title} — tahrirlash`} onClick={() => setOpen(true)}>
          <Pencil />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Qo&apos;shish
        </Button>
      )}
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setFormKey((k) => k + 1);
        }}
        title={item ? "Yo'lni tahrirlash" : "Yo'lga qo'shish"}
        description="Hackathon, ish, kurs yoki loyiha — qilgan ishingizni ko'rsating."
      >
        <JourneyForm key={formKey} mySkills={mySkills} item={item} onSaved={() => setOpen(false)} />
      </ResponsiveDialog>
    </>
  );
}

function JourneyForm({ mySkills, item, onSaved }: Props & { onSaved: () => void }) {
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

      <FormField id="type" label="Turi" errors={errors?.type}>
        <NativeSelect id="type" name="type" defaultValue={item?.type ?? "hackathon"}>
          {JOURNEY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="title" label="Nomi" errors={errors?.title}>
        <Input id="title" name="title" maxLength={120} defaultValue={item?.title} aria-describedby="title-desc" />
      </FormField>
      <FormField
        id="organization"
        label="Tashkilot"
        hint="Tasdiqlash uchun nom va tashkilot boshqa ishtirokchilarniki bilan bir xil bo'lsin."
        errors={errors?.organization}
      >
        <Input id="organization" name="organization" maxLength={120} defaultValue={item?.organization ?? ""} aria-describedby="organization-desc" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="role" label="Rolingiz" errors={errors?.role}>
          <Input id="role" name="role" maxLength={80} defaultValue={item?.role ?? ""} />
        </FormField>
        <FormField id="result" label="Natija" hint="Masalan: G'olib, Finalchi" errors={errors?.result}>
          <Input id="result" name="result" maxLength={80} defaultValue={item?.result ?? ""} aria-describedby="result-desc" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="start_date" label="Boshlanish" errors={errors?.start_date}>
          <Input id="start_date" name="start_date" type="month" defaultValue={item?.start_date?.slice(0, 7) ?? ""} />
        </FormField>
        <FormField id="end_date" label="Tugash" hint="Davom etsa bo'sh qoldiring" errors={errors?.end_date}>
          <Input id="end_date" name="end_date" type="month" defaultValue={item?.end_date?.slice(0, 7) ?? ""} aria-describedby="end_date-desc" />
        </FormField>
      </div>
      {mySkills.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Qaysi ko&apos;nikmalarni ishlatdingiz?</legend>
          <div className="flex flex-wrap gap-2">
            {mySkills.map((skill) => (
              <ToggleChip key={skill.id} selected={skillIds.has(skill.id)} onClick={() => toggleSkill(skill.id)}>
                {skill.name}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      ) : null}
      <FormField id="description" label="Tavsif" errors={errors?.description}>
        <Textarea id="description" name="description" maxLength={1000} defaultValue={item?.description ?? ""} />
      </FormField>
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </Button>
    </form>
  );
}
