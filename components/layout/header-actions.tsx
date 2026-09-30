import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Static until auth (Phase 3) and notifications (Phase 7) exist.
export function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="text-muted hover:text-text inline-flex size-11 items-center justify-center rounded-full transition-colors"
      >
        <Bell className="size-5" />
      </Link>
      <Link
        href="/profile"
        aria-label="Your profile"
        className="inline-flex size-11 items-center justify-center rounded-full"
      >
        <Avatar>
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}
