"use client";

import Link from "next/link";
import { LifeBuoy, LogOut, Settings, User } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./notification-bell";
import type { Me } from "./types";
import { useT } from "@/components/i18n/i18n-provider";

export function HeaderActions({ me }: { me: Me }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1">
      <NotificationBell userId={me.id} initialUnread={me.unread} />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("Profil menyusi")}
          className="focus-visible:ring-ring/50 inline-flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3"
        >
          <UserAvatar name={me.fullName} url={me.avatarUrl} size="sm" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={`/u/${me.username}`} />}>
            <User aria-hidden />
            {t("Profilim")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings aria-hidden />
            {t("Sozlamalar")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/support" />}>
            <LifeBuoy aria-hidden />
            {t("Yordam va qo'llab-quvvatlash")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void signOut()}>
            <LogOut aria-hidden />
            {t("Chiqish")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
