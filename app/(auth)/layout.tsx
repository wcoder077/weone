import { Logo } from "@/components/layout/logo";

// Mobile: full-width card. From sm: wider card with more room; logo sits above it.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10 sm:gap-8 sm:py-16">
      <Logo className="text-3xl" />
      <div className="bg-card border-border rounded-card shadow-bar flex w-full max-w-[420px] flex-col gap-6 border px-6 py-8 sm:max-w-[500px] sm:gap-7 sm:px-12 sm:py-12">
        {children}
      </div>
    </main>
  );
}
