"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useLongPress } from "@/components/messages/use-long-press";
import { useT } from "@/components/i18n/i18n-provider";
import { LinkPending } from "./link-pending";
import { ProfileMenu } from "./profile-menu";
import type { Me } from "./types";

const HOLD_MS = 600;

// The last tab of the bottom bar: your own photo. A tap opens your profile; holding it opens the
// menu (help, theme, settings, log out), the way the avatar menu at the top used to work.
export function ProfileTab({ me, href, active }: { me: Me; href: string; active: boolean }) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const heldRef = useRef(false);
  const longPress = useLongPress(() => {
    heldRef.current = true;
    navigator.vibrate?.(10);
    setMenuOpen(true);
  }, HOLD_MS);

  return (
    <>
      <Link
        href={href}
        {...longPress}
        onClick={(event) => {
          // The release after a long press must not also open the profile.
          if (heldRef.current) {
            event.preventDefault();
            heldRef.current = false;
          }
        }}
        aria-current={active ? "page" : undefined}
        aria-haspopup="dialog"
        className={cn(
          "relative z-10 flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[13px] font-medium transition-colors",
          active ? "text-primary-foreground" : "text-muted",
        )}
      >
        <UserAvatar name={me.fullName} url={me.avatarUrl} size="xs" preview={false} />
        <span>{t("Profil")}</span>
        <LinkPending />
      </Link>
      <ProfileMenu me={me} open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
