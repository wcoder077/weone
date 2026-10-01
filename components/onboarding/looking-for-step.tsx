"use client";

import { useActionState, useState } from "react";
import { finishOnboarding } from "@/lib/actions/onboarding";
import { LOOKING_FOR, type LookingFor } from "@/lib/constants";
import { FormMessage } from "@/components/shared/form-field";
import { ToggleChip } from "@/components/shared/skill-chip";
import { Switch } from "@/components/ui/switch";
import { StepFooter } from "./step-shell";

export function LookingForStep({
  initial,
  initialOnline,
}: {
  initial: string[];
  initialOnline: boolean;
}) {
  const [state, action, pending] = useActionState(finishOnboarding, null);
  const [selected, setSelected] = useState(() => new Set(initial));

  function toggle(value: LookingFor) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-base font-semibold">Nimani qidiryapsiz?</legend>
        <div className="flex flex-wrap gap-2.5">
          {LOOKING_FOR.map((option) => (
            <ToggleChip
              key={option.value}
              selected={selected.has(option.value)}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
        {[...selected].map((value) => (
          <input key={value} type="hidden" name="looking_for" value={value} />
        ))}
      </fieldset>

      <label className="bg-card border-border rounded-card flex min-h-11 cursor-pointer items-center justify-between gap-4 border p-5">
        <span className="flex flex-col gap-1">
          <span className="font-medium">Onlayn ishlashga tayyorman</span>
          <span className="text-muted text-[14px]">Boshqa shahardagi jamoalar ham sizni topadi</span>
        </span>
        <Switch name="is_online_ok" defaultChecked={initialOnline} />
      </label>

      <StepFooter step={3} pending={pending} submitLabel="Tugatish">
        <FormMessage error={state?.error} />
      </StepFooter>
    </form>
  );
}
