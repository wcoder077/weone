"use client";

import { useActionState, useState } from "react";
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

export type ProjectFormInitial = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  status: string;
  city: string | null;
  is_online: boolean;
  github_url: string | null;
  demo_url: string | null;
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
  const [state, action, pending] = useActionState(initial ? updateProject : createProject, null);
  const [stack, setStack] = useState(initial?.skill_ids ?? []);
  const [roles, setRoles] = useState<RoleDraft[]>(() =>
    initial ? initial.roles.map((r) => ({ ...r, key: r.id ?? crypto.randomUUID() })) : [newRoleDraft()],
  );
  const errors = state?.fieldErrors;
  const rolesPayload = JSON.stringify(
    roles.filter((r) => r.title.trim()).map(({ id, title, is_open, skill_ids }) => ({ id, title, is_open, skill_ids })),
  );

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {initial ? <input type="hidden" name="project_id" value={initial.id} /> : null}
      <input type="hidden" name="roles" value={rolesPayload} />
      {stack.map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}

      {initial ? (
        <FormField id="logo" label="Logo" errors={errors?.logo_url}>
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

      <FormField id="name" label="Nomi" errors={errors?.name}>
        <Input id="name" name="name" maxLength={80} defaultValue={initial?.name} aria-describedby="name-desc" />
      </FormField>
      <FormField id="tagline" label="Bir jumlada" hint="Masalan: Talabalar uchun kitob almashish ilovasi" errors={errors?.tagline}>
        <Input id="tagline" name="tagline" maxLength={140} defaultValue={initial?.tagline ?? ""} aria-describedby="tagline-desc" />
      </FormField>
      <FormField id="description" label="Batafsil" errors={errors?.description}>
        <Textarea id="description" name="description" maxLength={3000} rows={5} defaultValue={initial?.description ?? ""} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="category" label="Soha" errors={errors?.category}>
          <Input id="category" name="category" list="category-options" maxLength={40} defaultValue={initial?.category ?? ""} />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
        <FormField id="status" label="Holat" errors={errors?.status}>
          <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "idea"}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="city" label="Shahar" errors={errors?.city}>
          <Input id="city" name="city" list="city-options" maxLength={60} defaultValue={initial?.city ?? ""} />
          <datalist id="city-options">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
        <label className="flex min-h-11 items-center justify-between gap-3 self-end rounded-2xl border border-border px-4 py-2.5 text-[14px]">
          Onlayn ishlash mumkin
          <Switch name="is_online" defaultChecked={initial?.is_online ?? true} />
        </label>
        <FormField id="github_url" label="GitHub" errors={errors?.github_url}>
          <Input id="github_url" name="github_url" type="url" placeholder="https://github.com/…" defaultValue={initial?.github_url ?? ""} aria-describedby="github_url-desc" />
        </FormField>
        <FormField id="demo_url" label="Demo" errors={errors?.demo_url}>
          <Input id="demo_url" name="demo_url" type="url" placeholder="https://…" defaultValue={initial?.demo_url ?? ""} aria-describedby="demo_url-desc" />
        </FormField>
      </div>

      <FormField id="stack" label="Texnologiyalar" errors={errors?.skill_ids}>
        <SkillMultiPicker label="Loyiha texnologiyalari" skills={skills} value={stack} onChange={setStack} />
      </FormField>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Kim kerak?</h2>
        <p className="text-muted text-[14px]">Ochiq rollar loyihani mos maqsaddoshlarga ko&apos;rsatadi.</p>
        <RolesEditor roles={roles} onChange={setRoles} skills={skills} />
        {errors?.roles ? <p className="text-danger text-[13px]">{errors.roles[0]}</p> : null}
      </section>

      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} className="sm:self-end">
        {pending ? "Saqlanmoqda…" : initial ? "Saqlash" : "Loyiha yaratish"}
      </Button>
    </form>
  );
}
