"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { requestToJoin } from "@/lib/actions/projects";
import type { ActionState } from "@/lib/actions/types";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function JoinDialog({
  projectId,
  projectName,
  roles,
  roleId,
  variant = "default",
  label = "Qo'shilishni so'rash",
}: {
  projectId: string;
  projectName: string;
  roles: { id: string; title: string }[];
  roleId?: string;
  variant?: "default" | "outline";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await requestToJoin(prev, formData);
    if (result?.message) {
      toast.success(result.message);
      setOpen(false);
    }
    return result;
  }, null);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={variant === "outline" ? "w-full" : undefined}>
        {label}
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`${projectName} jamoasiga qo'shilish`}
        description="Egasiga qisqacha yozing: nima qila olasiz va nega qiziqasiz."
      >
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="project_id" value={projectId} />
          {roles.length > 0 ? (
            <FormField id="project_role_id" label="Rol">
              <NativeSelect id="project_role_id" name="project_role_id" defaultValue={roleId ?? ""}>
                <option value="">Har qanday rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : (
            <input type="hidden" name="project_role_id" value="" />
          )}
          <FormField id="message" label="Xabar" errors={state?.fieldErrors?.message}>
            <Textarea id="message" name="message" maxLength={500} rows={4} />
          </FormField>
          <FormMessage error={state?.error} />
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Yuborilmoqda…" : "So'rov yuborish"}
          </Button>
        </form>
      </ResponsiveDialog>
    </>
  );
}
