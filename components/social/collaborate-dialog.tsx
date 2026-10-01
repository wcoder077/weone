"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { sendCollab } from "@/lib/actions/social";
import type { ActionState } from "@/lib/actions/types";
import { COLLAB_REASONS } from "@/lib/constants";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { ToggleChip } from "@/components/shared/skill-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CollaborateDialog({
  userId,
  name,
  projects,
  alreadySent,
  className,
}: {
  userId: string;
  name: string;
  projects: { id: string; name: string }[];
  alreadySent: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await sendCollab(prev, formData);
    if (result?.message) {
      toast.success(result.message);
      setOpen(false);
    }
    return result;
  }, null);

  if (alreadySent) {
    return (
      <Button variant="outline" disabled className={className}>
        Taklif yuborilgan
      </Button>
    );
  }

  return (
    <>
      <Button className={className} onClick={() => setOpen(true)}>
        Hamkorlik
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`${name} bilan hamkorlik`}
        description="Qabul qilinsa, suhbat ochiladi va xabaringiz birinchi xabar bo'ladi."
      >
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="receiver_id" value={userId} />
          <input type="hidden" name="reason" value={reason} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Nima uchun?</legend>
            <div className="flex flex-wrap gap-2">
              {COLLAB_REASONS.map((r) => (
                <ToggleChip key={r.value} selected={reason === r.value} onClick={() => setReason(r.value)}>
                  {r.label}
                </ToggleChip>
              ))}
            </div>
            {state?.fieldErrors?.reason ? <p className="text-danger text-[13px]">{state.fieldErrors.reason[0]}</p> : null}
          </fieldset>
          {projects.length > 0 ? (
            <FormField id="collab_project" label="Loyiha (ixtiyoriy)">
              <NativeSelect id="collab_project" name="project_id" defaultValue="">
                <option value="">Loyihasiz</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}
          <FormField id="collab_message" label="Xabar" errors={state?.fieldErrors?.message}>
            <Textarea id="collab_message" name="message" maxLength={500} rows={4} placeholder="Qisqacha: nima qilmoqchisiz?" />
          </FormField>
          <FormMessage error={state?.error} />
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Yuborilmoqda…" : "Taklif yuborish"}
          </Button>
        </form>
      </ResponsiveDialog>
    </>
  );
}
