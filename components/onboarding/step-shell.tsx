import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ONBOARDING_STEPS = 3;

export function StepHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div
        role="progressbar"
        aria-label="Profilni sozlash jarayoni"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS}
        aria-valuenow={step}
        className="bg-border h-1 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{ width: `${(step / ONBOARDING_STEPS) * 100}%` }}
        />
      </div>
      <p className="text-muted text-[15px]">
        {step}-qadam, jami {ONBOARDING_STEPS}
      </p>
      <h1 className="text-2xl font-bold lg:text-[32px]">{title}</h1>
      <p className="text-muted text-[15px]">{description}</p>
    </header>
  );
}

export function StepFooter({
  step,
  pending,
  submitLabel = "Keyingi",
  children,
}: {
  step: number;
  pending: boolean;
  submitLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pt-4">
      {children}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <Link
            href={`/onboarding?step=${step - 1}`}
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "text-muted")}
          >
            Orqaga
          </Link>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending} className={buttonVariants({ size: "lg" })}>
          {pending ? "Saqlanmoqda…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
