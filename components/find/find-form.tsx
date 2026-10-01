"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CITIES, FIND_PURPOSES } from "@/lib/constants";
import { FormField } from "@/components/shared/form-field";
import { SkillMultiPicker } from "@/components/shared/skill-multi-picker";
import { ToggleChip } from "@/components/shared/skill-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type FindFormValues = {
  role: string;
  purpose: string;
  skillIds: string[];
  city: string;
  online: boolean;
  openOnly: boolean;
};

export function FindForm({
  skills,
  initial,
}: {
  skills: { id: string; name: string }[];
  initial: FindFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const set = <K extends keyof FindFormValues>(key: K, value: FindFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (values.role.trim()) params.set("role", values.role.trim());
    if (values.purpose) params.set("for", values.purpose);
    for (const id of values.skillIds) params.append("s", id);
    if (values.city.trim()) params.set("city", values.city.trim());
    if (values.online) params.set("online", "1");
    if (values.openOnly) params.set("open", "1");
    params.set("go", "1");
    router.push(`/find?${params.toString()}`, { scroll: false });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Menga kerak</h2>
      <FormField id="role" label="Rol">
        <Input id="role" value={values.role} onChange={(e) => set("role", e.target.value)} placeholder="Masalan: Backend dasturchi" maxLength={80} />
      </FormField>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Nima uchun</legend>
        <div className="flex flex-wrap gap-2">
          {FIND_PURPOSES.map((p) => (
            <ToggleChip
              key={p.value}
              selected={values.purpose === p.value}
              onClick={() => set("purpose", values.purpose === p.value ? "" : p.value)}
            >
              {p.label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Kerakli ko&apos;nikmalar</span>
        <SkillMultiPicker label="Kerakli ko'nikmalar" skills={skills} value={values.skillIds} onChange={(ids) => set("skillIds", ids)} max={8} />
      </div>
      <FormField id="city" label="Shahar">
        <Input id="city" list="find-city-options" value={values.city} onChange={(e) => set("city", e.target.value)} maxLength={60} />
        <datalist id="find-city-options">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </FormField>
      <label className="flex min-h-11 items-center justify-between gap-3 text-[14px]">
        Onlayn ham bo&apos;ladi
        <Switch checked={values.online} onCheckedChange={(v) => set("online", v)} />
      </label>
      <label className="flex min-h-11 items-center justify-between gap-3 text-[14px]">
        Faqat hamkorlikka ochiqlar
        <Switch checked={values.openOnly} onCheckedChange={(v) => set("openOnly", v)} />
      </label>
      <Button type="submit" size="lg">
        Natijalarni ko&apos;rsatish
      </Button>
    </form>
  );
}
