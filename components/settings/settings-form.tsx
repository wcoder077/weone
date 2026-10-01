"use client";

import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { checkUsername, type UsernameStatus } from "@/lib/actions/onboarding";
import { saveSettings } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import { CITIES, LOOKING_FOR } from "@/lib/constants";
import type { MyProfile } from "@/lib/queries/profiles";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { ToggleChip } from "@/components/shared/skill-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./tag-input";

export function SettingsForm({ profile }: { profile: MyProfile }) {
  const [name, setName] = useState(profile.full_name);
  const [lookingFor, setLookingFor] = useState(() => new Set(profile.looking_for));
  const [usernameTaken, setUsernameTaken] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await saveSettings(prev, formData);
    if (result?.message) toast.success(result.message);
    return result;
  }, null);
  const errors = state?.fieldErrors;

  function onUsernameChange(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const status: UsernameStatus = await checkUsername(value);
      setUsernameTaken(status === "taken");
    }, 400);
  }

  function toggleLookingFor(value: string) {
    setLookingFor((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AvatarUpload userId={profile.id} name={name} initialUrl={profile.avatar_url} />
      {errors?.avatar_url ? <p className="text-danger text-[13px]">{errors.avatar_url[0]}</p> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="full_name" label="Ism va familiya" errors={errors?.full_name}>
          <Input id="full_name" name="full_name" value={name} onChange={(e) => setName(e.target.value)} aria-describedby="full_name-desc" />
        </FormField>
        <FormField
          id="username"
          label="Username"
          errors={errors?.username ?? (usernameTaken ? ["Bu username band"] : undefined)}
        >
          <Input
            id="username"
            name="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={profile.username}
            onChange={(e) => onUsernameChange(e.target.value)}
            aria-describedby="username-desc"
            aria-invalid={Boolean(errors?.username) || usernameTaken}
          />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="city" label="Shahar" errors={errors?.city}>
          <Input id="city" name="city" list="city-options" defaultValue={profile.city ?? ""} />
          <datalist id="city-options">
            {CITIES.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </FormField>
        <FormField id="headline" label="Qisqacha" errors={errors?.headline}>
          <Input id="headline" name="headline" maxLength={120} defaultValue={profile.headline ?? ""} />
        </FormField>
      </div>
      <FormField id="bio" label="Haqida" errors={errors?.bio}>
        <Textarea id="bio" name="bio" maxLength={1000} rows={4} defaultValue={profile.bio ?? ""} />
      </FormField>
      <FormField id="languages" label="Tillar" hint="Enter bilan qo'shing" errors={errors?.languages}>
        <TagInput id="languages" name="languages" initial={profile.languages} placeholder="Masalan: O'zbek" />
      </FormField>
      <FormField id="interests" label="Qiziqishlar" hint="Enter bilan qo'shing" errors={errors?.interests}>
        <TagInput id="interests" name="interests" initial={profile.interests} placeholder="Masalan: Startaplar" />
      </FormField>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">Nimani qidiryapsiz?</legend>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR.map((option) => (
            <ToggleChip
              key={option.value}
              selected={lookingFor.has(option.value)}
              onClick={() => toggleLookingFor(option.value)}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
        {[...lookingFor].map((value) => (
          <input key={value} type="hidden" name="looking_for" value={value} />
        ))}
      </fieldset>

      <SwitchRow name="available" label="Hamkorlikka ochiqman" hint="Profilingizda yashil nuqta ko'rinadi" defaultChecked={profile.available} />
      <SwitchRow name="is_online_ok" label="Onlayn ishlashga tayyorman" hint="Boshqa shahardagi jamoalar ham sizni topadi" defaultChecked={profile.is_online_ok} />

      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} className="sm:self-end">
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </Button>
    </form>
  );
}

function SwitchRow({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="bg-surface border-border flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4">
      <span className="flex flex-col gap-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted text-[14px]">{hint}</span>
      </span>
      <Switch name={name} defaultChecked={defaultChecked} />
    </label>
  );
}
