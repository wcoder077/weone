"use client";

import { useState, useTransition } from "react";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { sendProjectInvite } from "@/lib/actions/messages";
import type { ChatMessage } from "@/lib/queries/messages";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";

export function InviteToProject({
  conversationId,
  projects,
  onSent,
}: {
  conversationId: string;
  projects: { id: string; name: string }[];
  onSent: (message: ChatMessage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (projects.length === 0) return null;

  function invite(projectId: string) {
    startTransition(async () => {
      const result = await sendProjectInvite(conversationId, projectId);
      if ("error" in result) toast.error(result.error);
      else {
        onSent(result.message);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FolderPlus data-icon="inline-start" />
        <span className="hidden sm:inline">Loyihaga taklif</span>
        <span className="sm:hidden">Taklif</span>
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Loyihaga taklif qilish" description="Taklif chatda karta bo'lib ko'rinadi.">
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Button variant="outline" size="lg" className="w-full justify-start" disabled={pending} onClick={() => invite(p.id)}>
                {p.name}
              </Button>
            </li>
          ))}
        </ul>
      </ResponsiveDialog>
    </>
  );
}
