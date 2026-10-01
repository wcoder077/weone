"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { saveSkill } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import { evidenceText, type SkillLevel } from "@/lib/constants";
import { FormMessage } from "@/components/shared/form-field";
import { LevelPicker } from "@/components/shared/level-picker";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { SkillChip, ToggleChip } from "@/components/shared/skill-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SkillDialogData = {
  allSkills: { id: string; name: string }[];
  mySkills: { skill_id: string; level: SkillLevel }[];
  // Projects I'm a member of; only owned ones can change their stack.
  myProjects: { id: string; name: string; owned: boolean; skillIds: string[] }[];
  myJourney: { id: string; title: string; skillIds: string[] }[];
};

export function AddSkillDialog(data: SkillDialogData) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Ko&apos;nikma
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setFormKey((k) => k + 1);
        }}
        title="Ko'nikma qo'shish"
        description="Qayerda ishlatganingizni belgilang — bu ko'nikmangizning isboti."
      >
        <AddSkillForm key={formKey} {...data} onSaved={() => setOpen(false)} />
      </ResponsiveDialog>
    </>
  );
}

type Choice = { id: string | null; name: string };

function AddSkillForm({
  allSkills,
  mySkills,
  myProjects,
  myJourney,
  onSaved,
}: SkillDialogData & { onSaved: () => void }) {
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [level, setLevel] = useState<SkillLevel>("comfortable");
  const [projectIds, setProjectIds] = useState<Set<string>>(new Set());
  const [journeyIds, setJourneyIds] = useState<Set<string>>(new Set());
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await saveSkill(prev, formData);
    if (result?.message) onSaved();
    return result;
  }, null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allSkills.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [allSkills, query]);
  const exact = matches.some((s) => s.name.toLowerCase() === query.trim().toLowerCase());

  // Picking a skill pre-fills its current level and where it is already linked.
  function pick(next: Choice) {
    setChoice(next);
    const existing = next.id ? mySkills.find((s) => s.skill_id === next.id) : undefined;
    setLevel(existing?.level ?? "comfortable");
    setProjectIds(new Set(next.id ? myProjects.filter((p) => p.owned && p.skillIds.includes(next.id!)).map((p) => p.id) : []));
    setJourneyIds(new Set(next.id ? myJourney.filter((j) => j.skillIds.includes(next.id!)).map((j) => j.id) : []));
  }

  function toggle(set: Set<string>, id: string, update: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  }

  const memberProjectsWithSkill = choice?.id
    ? myProjects.filter((p) => !p.owned && p.skillIds.includes(choice.id!)).length
    : 0;
  const preview = evidenceText(projectIds.size + memberProjectsWithSkill, journeyIds.size);
  const ownedProjects = myProjects.filter((p) => p.owned);

  if (!choice) {
    return (
      <div className="flex flex-col gap-4">
        <Input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ko'nikmani qidiring, masalan React"
          aria-label="Ko'nikmani qidirish"
        />
        <div className="flex flex-wrap gap-2">
          {matches.map((skill) => (
            <ToggleChip key={skill.id} selected={false} onClick={() => pick(skill)}>
              {skill.name}
            </ToggleChip>
          ))}
          {query.trim() && !exact ? (
            <ToggleChip selected={false} onClick={() => pick({ id: null, name: query.trim().slice(0, 40) })}>
              <Plus className="size-4" aria-hidden />
              &laquo;{query.trim().slice(0, 40)}&raquo; qo&apos;shish
            </ToggleChip>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="skill_id" value={choice.id ?? ""} />
      <input type="hidden" name="new_skill_name" value={choice.id ? "" : choice.name} />
      <input type="hidden" name="level" value={level} />
      {[...projectIds].map((id) => (
        <input key={id} type="hidden" name="project_ids" value={id} />
      ))}
      {[...journeyIds].map((id) => (
        <input key={id} type="hidden" name="journey_ids" value={id} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkillChip matched className="h-9 text-[14px]">
          {choice.name}
          {preview ? <span className="text-muted">· {preview}</span> : null}
        </SkillChip>
        <button type="button" onClick={() => setChoice(null)} className="text-muted hover:text-text min-h-11 text-[14px]">
          Boshqasini tanlash
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Darajangiz</span>
        <LevelPicker skillName={choice.name} value={level} onChange={setLevel} />
      </div>

      {ownedProjects.length + myJourney.length > 0 ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-2 text-sm font-medium">Qayerda ishlatgansiz?</legend>
          {ownedProjects.map((p) => (
            <UsageCheckbox
              key={p.id}
              label={p.name}
              hint="Loyiha"
              checked={projectIds.has(p.id)}
              onChange={() => toggle(projectIds, p.id, setProjectIds)}
            />
          ))}
          {myJourney.map((j) => (
            <UsageCheckbox
              key={j.id}
              label={j.title}
              hint="Yo'l"
              checked={journeyIds.has(j.id)}
              onChange={() => toggle(journeyIds, j.id, setJourneyIds)}
            />
          ))}
        </fieldset>
      ) : (
        <p className="text-muted text-[14px]">
          Loyiha yoki tadbir qo&apos;shsangiz, ko&apos;nikmangizni ular bilan isbotlay olasiz.
        </p>
      )}

      <FormMessage error={state?.error ?? state?.fieldErrors?.skill_id?.[0]} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </Button>
    </form>
  );
}

function UsageCheckbox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="hover:bg-surface flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-primary size-4" />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-muted text-[13px]">{hint}</span>
    </label>
  );
}
