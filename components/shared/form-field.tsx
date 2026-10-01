import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
  className?: string;
  children: ReactNode;
};

// Label + control + hint/error. The control must use the same `id`
// and `aria-describedby={`${id}-desc`}`.
export function FormField({ id, label, hint, errors, className, children }: FormFieldProps) {
  const error = errors?.[0];
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error || hint ? (
        <p id={`${id}-desc`} className={cn("text-[13px]", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-[14px]",
        error ? "border-danger/40 text-danger" : "border-border text-text",
      )}
    >
      {error ?? message}
    </p>
  );
}
