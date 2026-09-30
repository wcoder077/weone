import { Compass, FolderKanban, House, MessageCircle, User } from "lucide-react";

export const navItems = [
  { href: "/home", label: "Home", icon: House },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

// Desktop navbar shows these; Profile lives in the avatar there.
export const desktopNavItems = navItems.filter((i) => i.href !== "/profile");

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
