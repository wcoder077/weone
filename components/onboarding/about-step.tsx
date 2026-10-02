"use client";

import { useActionState, useRef, useState } from "react";
import { checkUsername, saveAbout, type UsernameStatus } from "@/lib/actions/onboarding";
import { isGeneratedUsername } from "@/lib/validation/profile";
import { CITIES } from "@/lib/constants";
import type { MyProfile } from "@/lib/queries/profiles";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { StepFooter } from "./step-shell";
import { useT } from "@/components/i18n/i18n-provider";

const USERNAME_HINTS: Record<UsernameStatus | "checking", string> = {
  checking: "Tekshirilmoqda…",
  available: "Bo'sh — olishingiz mumkin",
  taken: "Bu foydalanuvchi nomi band",
  invalid: "3–30 ta belgi: kichik lotin harflari, raqamlar va _",
};

export function AboutStep({ profile }: { profile: MyProfile }) {
  const t = useT();
  const [state, action, pending] = useActionState(saveAbout, null);
  const [name, setName] = useState(profile.full_name);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus | "checking" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function onUsernameChange(value: string) {
    clearTimeout(timer.current);
    if (!value.trim()) {
      setUsernameStatus(null);
      return;
    }
    setUsernameStatus("checking");
    timer.current = setTimeout(async () => setUsernameStatus(await checkUsername(value)), 400);
  }

  const errors = state?.fieldErrors;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AvatarUpload userId={profile.id} name={name} initialUrl={profile.avatar_url} />
      {errors?.avatar_url ? <p className="text-danger text-[13px]">{t(errors.avatar_url[0])}</p> : null}

      <FormField id="full_name" label={t("Ism va familiya")} errors={errors?.full_name}>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-describedby="full_name-desc"
          aria-invalid={Boolean(errors?.full_name)}
        />
      </FormField>

      <FormField
        id="username"
        label={t("Foydalanuvchi nomi")}
        hint={usernameStatus ? USERNAME_HINTS[usernameStatus] : t("Ixtiyoriy. Keyinroq ham qo'sha olasiz")}
        errors={errors?.username ?? (usernameStatus === "taken" ? [USERNAME_HINTS.taken] : undefined)}
      >
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={isGeneratedUsername(profile.username) ? "" : profile.username}
          placeholder={t("Foydalanuvchi nomi")}
          onChange={(e) => onUsernameChange(e.target.value)}
          aria-describedby="username-desc"
          aria-invalid={Boolean(errors?.username) || usernameStatus === "taken"}
        />
      </FormField>

      <FormField id="city" label={t("Shahar")} errors={errors?.city}>
        <Input
          id="city"
          name="city"
          list="city-options"
          autoComplete="address-level2"
          defaultValue={profile.city ?? ""}
          aria-describedby="city-desc"
        />
        <datalist id="city-options">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </FormField>

      <FormField
        id="headline"
        label={t("Qisqa tavsif")}
        hint={t("Masalan: Frontend dasturchi · React, TypeScript")}
        errors={errors?.headline}
      >
        <Input
          id="headline"
          name="headline"
          maxLength={120}
          defaultValue={profile.headline ?? ""}
          aria-describedby="headline-desc"
        />
      </FormField>

      <StepFooter step={1} pending={pending}>
        <FormMessage error={state?.error} />
      </StepFooter>
    </form>
  );
}
