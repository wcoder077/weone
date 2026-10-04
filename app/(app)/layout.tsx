import { Suspense } from "react";
import { NavigationTracker } from "@/components/shared/back-link";
import { redirect } from "next/navigation";
import { BarsVisibilityProvider } from "@/components/layout/bars-visibility";
import { PushPrompt } from "@/components/push/push-prompt";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { OnlinePresenceProvider } from "@/components/layout/online-presence";
import { Navbar } from "@/components/layout/navbar";
import { NavProgress } from "@/components/layout/nav-progress";
import { PageFade } from "@/components/layout/page-fade";
import { SwipeNavigation } from "@/components/layout/swipe-navigation";
import { UnreadMessagesProvider } from "@/components/layout/unread-messages";
import { getUnreadMessageTotal } from "@/lib/queries/messages";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getMyProfile } from "@/lib/queries/profiles";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");

  const [unread, unreadMessages] = await Promise.all([getUnreadCount(profile.id), getUnreadMessageTotal()]);
  const me = {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    unread,
  };

  return (
    <UnreadMessagesProvider meId={profile.id} initial={unreadMessages}>
      <OnlinePresenceProvider meId={profile.id}>
        <BarsVisibilityProvider>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <Navbar me={me} />
          <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-28 lg:px-8 lg:pb-12">
            <SwipeNavigation username={me.username}>
              <PageFade>{children}</PageFade>
            </SwipeNavigation>
          </main>
          <MobileTabBar me={me} />
          <NavigationTracker />
          <PushPrompt />
        </BarsVisibilityProvider>
      </OnlinePresenceProvider>
    </UnreadMessagesProvider>
  );
}
