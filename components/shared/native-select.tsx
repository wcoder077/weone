import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Native <select> styled like our inputs; submits with the form like any field.
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-11 w-full appearance-none rounded-full border pr-10 pl-4 text-[15px] outline-none focus-visible:ring-3",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
        aria-hidden
      />
    </span>
  );
}
