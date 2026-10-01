"use client";

import { SKILL_LEVELS, type SkillLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LevelPicker({
  skillName,
  value,
  onChange,
}: {
  skillName: string;
  value: SkillLevel;
  onChange: (level: SkillLevel) => void;
}) {
  return (
    <div role="radiogroup" aria-label={`${skillName} darajasi`} className="bg-surface flex rounded-full p-1">
      {SKILL_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          role="radio"
          aria-checked={value === level.value}
          onClick={() => onChange(level.value)}
          className={cn(
            "min-h-11 rounded-full px-3 text-[13px] font-medium transition-colors sm:min-h-9",
            value === level.value ? "bg-card text-text" : "text-muted hover:text-text",
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
