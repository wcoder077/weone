"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeSkill, updateSkillLevel } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import type { SkillLevel } from "@/lib/constants";
import { LevelPicker } from "@/components/shared/level-picker";
import { Button } from "@/components/ui/button";

type Row = { skill_id: string; name: string; level: SkillLevel };

export function SkillsManager({ skills }: { skills: Row[] }) {
  if (skills.length === 0) {
    return <p className="text-muted text-[14px]">Ko&apos;nikmalarni profilingizdagi &laquo;Ko&apos;nikma&raquo; tugmasi orqali qo&apos;shing.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {skills.map((skill) => (
        <SkillRow key={skill.skill_id} skill={skill} />
      ))}
    </ul>
  );
}

function SkillRow({ skill }: { skill: Row }) {
  const [pending, startTransition] = useTransition();
  const report = (result: ActionState) => {
    if (result?.error) toast.error(result.error);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2" aria-busy={pending}>
      <span className="font-medium">{skill.name}</span>
      <div className="flex items-center gap-1">
        <LevelPicker
          skillName={skill.name}
          value={skill.level}
          onChange={(level) => startTransition(async () => report(await updateSkillLevel(skill.skill_id, level)))}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${skill.name} — o'chirish`}
          disabled={pending}
          onClick={() => startTransition(async () => report(await removeSkill(skill.skill_id)))}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
