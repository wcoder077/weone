"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NativeSelect } from "./native-select";

// A filter that lives in the query string; changing it resets pagination.
// `multi` appends the picked value (repeated param) and resets the select.
export function UrlFilterSelect({
  param,
  label,
  options,
  multi = false,
}: {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  multi?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (multi) {
      if (value && !next.getAll(param).includes(value)) next.append(param, value);
    } else if (value) next.set(param, value);
    else next.delete(param);
    next.delete("page");
    // Transition keeps the current results on screen (with a spinner) until the new ones arrive.
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <span className="relative inline-flex items-center" aria-busy={pending}>
      <NativeSelect
        aria-label={label}
        value={multi ? "" : (searchParams.get(param) ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card h-11 w-auto min-w-36 text-[14px]"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
      {pending ? (
        <Loader2
          className="text-muted pointer-events-none absolute right-9 size-4 animate-spin"
          aria-label="Yuklanmoqda"
        />
      ) : null}
    </span>
  );
}
