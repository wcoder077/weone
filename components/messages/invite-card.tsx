"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestToJoin } from "@/lib/actions/projects";
import type { ChatMessage } from "@/lib/queries/messages";
import { formatTime } from "@/lib/format";
import { ProjectLogo } from "@/components/shared/project-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A project_invite message. "Qo'shilish" sends a join request; the owner accepts it
// (only owners can add members — enforced by RLS).
export function InviteCard({
  message,
  mine,
  alreadyMember,
}: {
  message: ChatMessage;
  mine: boolean;
  alreadyMember: boolean;
}) {
  const [requested, setRequested] = useState(false);
  const [pending, startTransition] = useTransition();
  const project = message.project;

  function join() {
    if (!message.projectId) return;
    const formData = new FormData();
    formData.set("project_id", message.projectId);
    formData.set("message", "Chatdagi taklif orqali");
    startTransition(async () => {
      const result = await requestToJoin(null, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("So'rov yuborildi");
        setRequested(true);
      }
    });
  }

  return (
    <div className={cn("flex w-full max-w-sm flex-col gap-1", mine ? "items-end self-end" : "items-start")}>
      <div className="border-border bg-surface flex w-full flex-col gap-3 rounded-3xl border p-4">
        <p className="text-muted text-[13px]">{mine ? "Siz loyihaga taklif qildingiz" : "Loyihaga taklif"}</p>
        {project ? (
          <div className="flex items-center gap-3">
            <ProjectLogo name={project.name} url={project.logo_url} className="size-10" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{project.name}</span>
              {project.tagline ? <span className="text-muted line-clamp-2 text-[13px]">{project.tagline}</span> : null}
            </div>
          </div>
        ) : (
          <p className="text-muted text-[14px]">Loyiha o&apos;chirilgan.</p>
        )}
        {project ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/projects/${project.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Loyihani ko&apos;rish
            </Link>
            {!mine && !alreadyMember ? (
              <Button size="sm" disabled={pending || requested} onClick={join}>
                {requested ? "So'rov yuborildi" : "Qo'shilish"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <span className="text-muted px-2 text-[11px]">{formatTime(message.createdAt)}</span>
    </div>
  );
}
