"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  cancelJoinRequest,
  decideJoinRequest,
  deleteProject,
  removeMember,
  setRoleOpen,
} from "@/lib/actions/projects";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";

function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast.error(result.error);
      else if (result?.message) toast.success(result.message);
    });
  return { pending, run };
}

function ActionButton({
  onRun,
  children,
  variant = "outline",
  size = "sm",
  label,
}: {
  onRun: () => Promise<ActionState>;
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default";
  label?: string;
}) {
  const { pending, run } = useAction();
  return (
    <Button variant={variant} size={size} disabled={pending} aria-label={label} onClick={() => run(onRun)}>
      {children}
    </Button>
  );
}

export function DecideRequestButtons({ requestId }: { requestId: string }) {
  return (
    <div className="flex gap-2">
      <ActionButton variant="default" onRun={() => decideJoinRequest(requestId, true)}>
        Qabul qilish
      </ActionButton>
      <ActionButton onRun={() => decideJoinRequest(requestId, false)}>Rad etish</ActionButton>
    </div>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  return <ActionButton onRun={() => cancelJoinRequest(requestId)}>Bekor qilish</ActionButton>;
}

export function RemoveMemberButton({ projectId, memberId, name }: { projectId: string; memberId: string; name: string }) {
  return (
    <ActionButton variant="ghost" label={`${name} — jamoadan chiqarish`} onRun={() => removeMember(projectId, memberId)}>
      Chiqarish
    </ActionButton>
  );
}

export function LeaveProjectButton({ projectId, userId }: { projectId: string; userId: string }) {
  return (
    <ActionButton variant="outline" size="default" onRun={() => removeMember(projectId, userId)}>
      Jamoadan chiqish
    </ActionButton>
  );
}

export function RoleToggleButton({ roleId, isOpen }: { roleId: string; isOpen: boolean }) {
  return (
    <ActionButton onRun={() => setRoleOpen(roleId, !isOpen)}>{isOpen ? "Rolni yopish" : "Qayta ochish"}</ActionButton>
  );
}

// Two-step: the first click asks, the second deletes.
export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        O&apos;chirish
      </Button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <ActionButton variant="destructive" size="default" onRun={() => deleteProject(projectId)}>
        Ha, butunlay o&apos;chirish
      </ActionButton>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Bekor qilish
      </Button>
    </span>
  );
}
