import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/queries/profiles";

// Stable link to "my profile"; the real page lives at /u/[username].
export default async function ProfileRedirect() {
  const profile = await getMyProfile();
  redirect(profile ? `/u/${profile.username}` : "/login");
}
