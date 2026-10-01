import { redirect } from "next/navigation";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Navbar } from "@/components/layout/navbar";
import { getMyProfile } from "@/lib/queries/profiles";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");

  const me = {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  };

  return (
    <>
      <Navbar me={me} />
      <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-28 lg:px-8 lg:pb-12">
        {children}
      </main>
      <MobileTabBar username={me.username} />
    </>
  );
}
