import { Compass, House, MessageCircle, SquarePlus, User } from "lucide-react";

export const navItems = [
  { href: "/home", label: "Asosiy", icon: House },
  { href: "/discover", label: "Kashf", icon: Compass },
  { href: "/posts", label: "Postlar", icon: SquarePlus },
  { href: "/messages", label: "Xabarlar", icon: MessageCircle },
  { href: "/profile", label: "Profil", icon: User },
] as const;

// Desktop navbar shows these; Profile lives in the avatar there.
export const desktopNavItems = navItems.filter((i) => i.href !== "/profile");

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// An open conversation (/messages/<id>): full-screen chat below lg, bars hidden.
export function isConversationPath(pathname: string) {
  return /^\/messages\/[^/]+$/.test(pathname);
}
