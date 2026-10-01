import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/queries/profiles";

// Runs before the page's loading boundary starts streaming, so these are real
// HTTP redirects rather than a streamed meta refresh.
export default async function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/home");
  return children;
}
