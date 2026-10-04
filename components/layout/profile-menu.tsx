"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LifeBuoy, LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import type { Me } from "./types";

const LOGOUT_SECONDS = 5;

// Opened by holding the profile tab. Settings and log out sit at the very bottom.
export function ProfileMenu({ me, open, onOpenChange }: { me: Me; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Profil menyusi">
      {open ? <MenuBody me={me} onClose={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}

function MenuBody({ me, onClose }: { me: Me; onClose: () => void }) {
  const t = useT();
  const [leaving, setLeaving] = useState(false);

  if (leaving) return <LogoutConfirm onCancel={() => setLeaving(false)} />;

  const row =
    "hover:bg-surface focus-visible:ring-ring/50 -mx-2 flex min-h-12 items-center gap-3 rounded-2xl px-2 text-[15px] outline-none focus-visible:ring-3";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <UserAvatar name={me.fullName} url={me.avatarUrl} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{me.fullName}</span>
          <span className="text-muted truncate text-[13px]">@{me.username}</span>
        </div>
      </div>

      <div className="flex flex-col">
        <Link href="/support" onClick={onClose} className={row}>
          <LifeBuoy className="text-muted size-5" aria-hidden />
          {t("Yordam va qo'llab-quvvatlash")}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted text-[13px]">{t("Mavzu")}</p>
        <ThemeToggle />
      </div>

      {/* Settings and log out are always the last two rows. */}
      <div className="border-border mt-2 flex flex-col border-t pt-2">
        <Link href="/settings" onClick={onClose} className={row}>
          <Settings className="text-muted size-5" aria-hidden />
          {t("Sozlamalar")}
        </Link>
        <button type="button" onClick={() => setLeaving(true)} className={`${row} text-danger w-[calc(100%+1rem)] text-left`}>
          <LogOut className="size-5" aria-hidden />
          {t("Chiqish")}
        </button>
      </div>
    </div>
  );
}

// "Are you sure?" with a 5 second countdown: when it runs out the account signs out. Cancel stops it.
function LogoutConfirm({ onCancel }: { onCancel: () => void }) {
  const t = useT();
  const [seconds, setSeconds] = useState(LOGOUT_SECONDS);
  const started = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 0 && !started.current) {
      started.current = true;
      void signOut();
    }
  }, [seconds]);

  return (
    <div className="flex flex-col gap-4" role="alertdialog" aria-labelledby="logout-title">
      <div className="flex flex-col gap-1">
        <h3 id="logout-title" className="text-lg font-semibold">
          {t("Hisobdan chiqishni tasdiqlaysizmi?")}
        </h3>
        <p className="text-muted text-[15px]" aria-live="polite">
          {t("{n} soniyadan keyin chiqasiz.", { n: seconds })}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" onClick={onCancel}>
          {t("Bekor qilish")}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          onClick={() => {
            if (started.current) return;
            started.current = true;
            void signOut();
          }}
        >
          {t("Hoziroq chiqish")}
        </Button>
      </div>
    </div>
  );
}
