"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleChip } from "./skill-chip";
import { useT } from "@/components/i18n/i18n-provider";

type Skill = { id: string; name: string };

// Search + pick skills. Selected ones show as removable solid chips.
export function SkillMultiPicker({
  skills,
  value,
  onChange,
  max = 15,
  label,
  placeholder = "Ko'nikmani qidiring",
}: {
  skills: Skill[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label: string;
  placeholder?: string;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const selected = new Set(value);
    return skills.filter((s) => !selected.has(s.id) && s.name.toLowerCase().includes(q)).slice(0, 10);
  }, [skills, query, value]);

  const full = value.length >= max;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {value.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== id))}
                aria-label={t("{v0} — olib tashlash", { v0: byId.get(id)?.name ?? "" })}
                className="bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium"
              >
                {byId.get(id)?.name}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={full ? t("Ko'pi bilan {max} ta", { max }) : placeholder}
        disabled={full}
        aria-label={label}
      />
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <ToggleChip
              key={s.id}
              selected={false}
              onClick={() => {
                onChange([...value, s.id]);
                setQuery("");
              }}
            >
              {s.name}
            </ToggleChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
