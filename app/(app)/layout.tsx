import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Navbar } from "@/components/layout/navbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-28 lg:px-8 lg:pb-12">
        {children}
      </main>
      <MobileTabBar />
    </>
  );
}
