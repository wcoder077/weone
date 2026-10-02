"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { useT } from "@/components/i18n/i18n-provider";

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
  const t = useT();
  return (
    <div className="flex gap-2">
      <ActionButton variant="default" onRun={() => decideJoinRequest(requestId, true)}>
        {t("Qabul qilish")}</ActionButton>
      <ActionButton onRun={() => decideJoinRequest(requestId, false)}>{t("Rad etish")}</ActionButton>
    </div>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const t = useT();
  return <ActionButton onRun={() => cancelJoinRequest(requestId)}>{t("Bekor qilish")}</ActionButton>;
}

export function RemoveMemberButton({ projectId, memberId, name }: { projectId: string; memberId: string; name: string }) {
  const t = useT();
  return (
    <ActionButton variant="ghost" label={t("{name} — jamoadan chiqarish", { name })} onRun={() => removeMember(projectId, memberId)}>
      {t("Chiqarish")}</ActionButton>
  );
}

export function LeaveProjectButton({ projectId, userId }: { projectId: string; userId: string }) {
  const t = useT();
  return (
    <ActionButton variant="outline" size="default" onRun={() => removeMember(projectId, userId)}>
      {t("Jamoadan chiqish")}</ActionButton>
  );
}

export function RoleToggleButton({ roleId, isOpen }: { roleId: string; isOpen: boolean }) {
  const t = useT();
  return (
    <ActionButton onRun={() => setRoleOpen(roleId, !isOpen)}>{isOpen ? t("Rolni yopish") : t("Qayta ochish")}</ActionButton>
  );
}

// Two-step: the first click asks, the second deletes. `redirectTo` leaves a page
// that no longer exists (the project's own page).
export function DeleteProjectButton({
  projectId,
  redirectTo,
  size = "default",
}: {
  projectId: string;
  redirectTo?: string;
  size?: "sm" | "default";
}) {
  const t = useT();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.message ?? "");
      if (redirectTo) router.push(redirectTo);
    });
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size={size} onClick={() => setConfirming(true)}>
        {t("O'chirish")}</Button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button variant="destructive" size={size} disabled={pending} onClick={remove}>
        {pending ? t("O'chirilmoqda…") : t("Ha, o'chirish")}
      </Button>
      <Button variant="ghost" size={size} onClick={() => setConfirming(false)}>
        {t("Bekor qilish")}</Button>
    </span>
  );
}
