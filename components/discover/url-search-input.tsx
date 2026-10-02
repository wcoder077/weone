"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

const DELAY = 300; // ms after the last keystroke

// Text filter kept in the query string. Results update while typing (debounced,
// in a transition so the current results stay visible until the new ones are ready).
export function UrlSearchInput({
  param,
  label,
  placeholder,
  className,
}: {
  param: string;
  label: string;
  placeholder: string;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(param) ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(text: string) {
    clearTimeout(timer.current);
    const next = new URLSearchParams(searchParams);
    if (text.trim()) next.set(param, text.trim());
    else next.delete(param);
    next.delete("page");
    if (next.toString() === searchParams.toString()) return;
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        apply(value);
      }}
    >
      <label className="sr-only" htmlFor={`search-${param}`}>
        {label}
      </label>
      <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" aria-hidden />
      <Input
        id={`search-${param}`}
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          clearTimeout(timer.current);
          const text = e.target.value;
          timer.current = setTimeout(() => apply(text), DELAY);
        }}
        placeholder={placeholder}
        className="bg-card h-12 pr-10 pl-11"
      />
      {pending ? (
        <Loader2 className="text-muted absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin" aria-label={t("Qidirilmoqda")} />
      ) : null}
    </form>
  );
}
