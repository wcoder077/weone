import type { ReactNode } from "react";

// Titled card used for page sections (profile, settings, home sidebar).
export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-base font-semibold whitespace-nowrap">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
