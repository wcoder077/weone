"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeSkill, updateSkillLevel } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";
import type { SkillLevel } from "@/lib/constants";
import { LevelPicker } from "@/components/shared/level-picker";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

type Row = { skill_id: string; name: string; level: SkillLevel };

export function SkillsManager({ skills }: { skills: Row[] }) {
  const t = useT();
  if (skills.length === 0) {
    return <p className="text-muted text-[14px]">{t("Ko'nikmalarni profilingizdagi &laquo;Ko'nikma&raquo; tugmasi orqali qo'shing.")}</p>;
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
  const t = useT();
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
          aria-label={t("{name} — o'chirish", { name: skill.name })}
          disabled={pending}
          onClick={() => startTransition(async () => report(await removeSkill(skill.skill_id)))}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
