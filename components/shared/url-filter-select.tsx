"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "./native-select";

// A filter that lives in the query string; changing it resets pagination.
export function UrlFilterSelect({
  param,
  label,
  options,
}: {
  param: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(param, value);
    else next.delete(param);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <NativeSelect
      aria-label={label}
      value={searchParams.get(param) ?? ""}
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
  );
}
