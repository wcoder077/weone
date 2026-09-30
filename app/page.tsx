import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";

// Stand-in until the Welcome page is built.
export default function Welcome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="text-2xl font-bold lg:text-[32px]">
        Find people. Build things. Grow together.
      </h1>
      <Link href="/home" className={buttonVariants({ size: "lg" })}>
        Get started
      </Link>
    </main>
  );
}
