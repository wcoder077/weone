"use client";

import { useActionState, useState, useTransition } from "react";
import { createProject, updateProject } from "@/lib/actions/projects";
import { CITIES, PROJECT_STATUSES } from "@/lib/constants";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { ImageUpload } from "@/components/shared/image-upload";
import { NativeSelect } from "@/components/shared/native-select";
import { ProjectLogo } from "@/components/shared/project-card";
import { SkillMultiPicker } from "@/components/shared/skill-multi-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RolesEditor, newRoleDraft, type RoleDraft } from "./roles-editor";
import { useT } from "@/components/i18n/i18n-provider";

export type ProjectFormInitial = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  status: string;
  city: string | null;
  is_online: boolean;
  chat_url: string | null;
  logo_url: string | null;
  skill_ids: string[];
  roles: Omit<RoleDraft, "key">[];
};

export function ProjectForm({
  skills,
  categories,
  initial,
}: {
  skills: { id: string; name: string }[];
  categories: string[];
  initial?: ProjectFormInitial;
}) {
  const t = useT();
  const [state, action, actionPending] = useActionState(initial ? updateProject : createProject, null);
  const [submitting, startSubmit] = useTransition();
  const pending = actionPending || submitting;
  const [stack, setStack] = useState(initial?.skill_ids ?? []);
  const [roles, setRoles] = useState<RoleDraft[]>(() =>
    initial ? initial.roles.map((r) => ({ ...r, key: r.id ?? crypto.randomUUID() })) : [newRoleDraft()],
  );
  const errors = state?.fieldErrors;
  const rolesPayload = JSON.stringify(
    roles.filter((r) => r.title.trim()).map(({ id, title, is_open, skill_ids }) => ({ id, title, is_open, skill_ids })),
  );

  return (
    <form
      // Not `action={...}`: React would clear every field after an error and the person would have to retype everything.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startSubmit(() => action(formData));
      }}
      className="flex flex-col gap-8"
      noValidate
    >
      {initial ? <input type="hidden" name="project_id" value={initial.id} /> : null}
      <input type="hidden" name="roles" value={rolesPayload} />
      {stack.map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}
      <p className="text-muted -mb-4 text-[13px]">{t("* — majburiy maydonlar")}</p>

      <FormSection title="Asosiy">
        {initial ? (
          <FormField id="logo" label={t("Logo")} errors={errors?.logo_url}>
            <ImageUpload
              bucket="project-logos"
              folder={initial.id}
              fieldName="logo_url"
              initialUrl={initial.logo_url}
              preview={(url) => <ProjectLogo name={initial.name} url={url} className="size-16" />}
            />
          </FormField>
        ) : (
          <input type="hidden" name="logo_url" value="" />
        )}
        <FormField id="name" label={t("Nomi")} required errors={errors?.name}>
          <Input id="name" name="name" maxLength={80} defaultValue={initial?.name} aria-required aria-describedby="name-desc" />
        </FormField>
        <FormField
          id="tagline"
          label={t("Bir jumlada")}
          required
          hint={t("Masalan: Talabalar uchun kitob almashish ilovasi")}
          errors={errors?.tagline}
        >
          <Input id="tagline" name="tagline" maxLength={140} defaultValue={initial?.tagline ?? ""} aria-required aria-describedby="tagline-desc" />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="category" label={t("Soha")} required errors={errors?.category}>
            <Input id="category" name="category" list="category-options" maxLength={40} defaultValue={initial?.category ?? ""} aria-required aria-describedby="category-desc" />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
          <FormField id="status" label={t("Holat")} errors={errors?.status}>
            <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "idea"}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Tafsilot">
        <FormField id="description" label={t("Batafsil")} errors={errors?.description}>
          <Textarea id="description" name="description" maxLength={3000} rows={5} defaultValue={initial?.description ?? ""} />
        </FormField>
      </FormSection>

      <FormSection title="Joylashuv">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="city" label={t("Shahar")} errors={errors?.city}>
            <Input id="city" name="city" list="city-options" maxLength={60} defaultValue={initial?.city ?? ""} />
            <datalist id="city-options">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
          <label className="flex min-h-11 items-center justify-between gap-3 self-end rounded-2xl border border-border px-4 py-2.5 text-[14px]">
            {t("Onlayn ishlash mumkin")}
            <Switch name="is_online" defaultChecked={initial?.is_online ?? true} />
          </label>
        </div>
      </FormSection>

      <FormSection title="Texnologiyalar">
        <FormField id="stack" label={t("Loyiha texnologiyalari")} errors={errors?.skill_ids}>
          <SkillMultiPicker label={t("Loyiha texnologiyalari")} skills={skills} value={stack} onChange={setStack} />
        </FormField>
      </FormSection>

      <FormSection title="Kim kerak?" description="Ochiq rollar loyihani mos maqsaddoshlarga ko'rsatadi.">
        <RolesEditor roles={roles} onChange={setRoles} skills={skills} />
        {errors?.roles ? <p className="text-danger text-[13px]">{t(errors.roles[0])}</p> : null}
      </FormSection>

      <FormSection title="Aloqa">
        <FormField id="chat_url" label={t("Telegram guruh linki")} hint={t("Faqat jamoa a'zolariga ko'rinadi")} errors={errors?.chat_url}>
          <Input
            id="chat_url"
            name="chat_url"
            type="url"
            inputMode="url"
            maxLength={300}
            placeholder="https://t.me/..."
            defaultValue={initial?.chat_url ?? ""}
            aria-describedby="chat_url-desc"
          />
        </FormField>
      </FormSection>

      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} className="sm:self-end">
        {pending ? t("Saqlanmoqda…") : initial ? t("Saqlash") : t("Loyiha yaratish")}
      </Button>
    </form>
  );
}

// A titled group of fields; the form reads as six short sections instead of one long list.
function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const t = useT();
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t(title)}</h2>
        {description ? <p className="text-muted text-[14px]">{t(description)}</p> : null}
      </div>
      {children}
    </section>
  );
}
