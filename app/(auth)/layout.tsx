import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="bg-card border-border rounded-card flex w-full max-w-[400px] flex-col gap-6 border px-6 py-10 sm:px-11">
        <div className="flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </main>
  );
}
