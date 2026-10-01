"use client";

import { useActionState, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { saveSkills } from "@/lib/actions/onboarding";
import { ONBOARDING_SKILLS, SKILL_CATEGORIES, type SkillLevel } from "@/lib/constants";
import type { Skill } from "@/lib/queries/skills";
import { FormMessage } from "@/components/shared/form-field";
import { LevelPicker } from "@/components/shared/level-picker";
import { ToggleChip } from "@/components/shared/skill-chip";
import { Input } from "@/components/ui/input";
import { StepFooter } from "./step-shell";

type Picked = Map<string, SkillLevel>;

export function SkillsStep({
  skills,
  initial,
}: {
  skills: Skill[];
  initial: { skill_id: string; level: SkillLevel }[];
}) {
  const [state, action, pending] = useActionState(saveSkills, null);
  const [picked, setPicked] = useState<Picked>(() => new Map(initial.map((s) => [s.skill_id, s.level])));
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = q ? skills.filter((s) => s.name.toLowerCase().includes(q)) : skills;
    return SKILL_CATEGORIES.map((c) => ({
      ...c,
      skills: visible.filter((s) => s.category === c.value),
    })).filter((g) => g.skills.length > 0);
  }, [skills, query]);

  const full = picked.size >= ONBOARDING_SKILLS.max;

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < ONBOARDING_SKILLS.max) next.set(id, "comfortable");
      return next;
    });
  }

  function setLevel(id: string, level: SkillLevel) {
    setPicked((prev) => new Map(prev).set(id, level));
  }

  const payload = JSON.stringify([...picked].map(([skill_id, level]) => ({ skill_id, level })));
  const pickedSkills = skills.filter((s) => picked.has(s.id));

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="skills" value={payload} />

      <label className="relative block">
        <span className="sr-only">Ko&apos;nikmalarni qidirish</span>
        <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ko'nikmalarni qidiring"
          className="bg-card h-12 pl-11"
        />
      </label>

      {groups.length === 0 ? (
        <p className="text-muted text-[15px]">Hech narsa topilmadi.</p>
      ) : (
        groups.map((group) => (
          <section key={group.value} className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">{group.label}</h2>
            <div className="flex flex-wrap gap-2.5">
              {group.skills.map((skill) => {
                const selected = picked.has(skill.id);
                return (
                  <ToggleChip
                    key={skill.id}
                    selected={selected}
                    disabled={!selected && full}
                    onClick={() => toggle(skill.id)}
                  >
                    {skill.name}
                  </ToggleChip>
                );
              })}
            </div>
          </section>
        ))
      )}

      {pickedSkills.length > 0 ? (
        <section className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
          <h2 className="text-base font-semibold">
            Darajangiz{" "}
            <span className="text-muted font-normal">
              · {picked.size}/{ONBOARDING_SKILLS.max}
            </span>
          </h2>
          <ul className="flex flex-col gap-3">
            {pickedSkills.map((skill) => (
              <li key={skill.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{skill.name}</span>
                <LevelPicker
                  skillName={skill.name}
                  value={picked.get(skill.id) ?? "comfortable"}
                  onChange={(level) => setLevel(skill.id, level)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <StepFooter step={2} pending={pending}>
        <FormMessage error={state?.error} />
      </StepFooter>
    </form>
  );
}
