"use client";

import { Plus, Trash2 } from "lucide-react";
import { SkillMultiPicker } from "@/components/shared/skill-multi-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type RoleDraft = {
  key: string;
  id: string | null;
  title: string;
  is_open: boolean;
  skill_ids: string[];
};

export function newRoleDraft(): RoleDraft {
  return { key: crypto.randomUUID(), id: null, title: "", is_open: true, skill_ids: [] };
}

export function RolesEditor({
  roles,
  onChange,
  skills,
}: {
  roles: RoleDraft[];
  onChange: (roles: RoleDraft[]) => void;
  skills: { id: string; name: string }[];
}) {
  const update = (key: string, patch: Partial<RoleDraft>) =>
    onChange(roles.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-4">
      {roles.map((role, index) => (
        <fieldset key={role.key} className="border-border flex flex-col gap-3 rounded-2xl border p-4">
          <legend className="sr-only">{`${index + 1}-rol`}</legend>
          <div className="flex items-center gap-2">
            <Input
              value={role.title}
              onChange={(e) => update(role.key, { title: e.target.value })}
              placeholder="Rol nomi, masalan Frontend dasturchi"
              maxLength={60}
              aria-label={`${index + 1}-rol nomi`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${index + 1}-rolni o'chirish`}
              onClick={() => onChange(roles.filter((r) => r.key !== role.key))}
            >
              <Trash2 />
            </Button>
          </div>
          <SkillMultiPicker
            label={`${index + 1}-rol uchun ko'nikmalar`}
            skills={skills}
            value={role.skill_ids}
            onChange={(skill_ids) => update(role.key, { skill_ids })}
            max={8}
          />
          <label className="flex min-h-11 items-center justify-between gap-3 text-[14px]">
            Rol ochiq — maqsaddoshlar so&apos;rov yubora oladi
            <Switch checked={role.is_open} onCheckedChange={(is_open) => update(role.key, { is_open })} />
          </label>
        </fieldset>
      ))}
      {roles.length < 10 ? (
        <Button type="button" variant="outline" className="self-start" onClick={() => onChange([...roles, newRoleDraft()])}>
          <Plus data-icon="inline-start" />
          Rol qo&apos;shish
        </Button>
      ) : null}
    </div>
  );
}
