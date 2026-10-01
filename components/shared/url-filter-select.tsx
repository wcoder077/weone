"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (multi) {
      if (value && !next.getAll(param).includes(value)) next.append(param, value);
    } else if (value) next.set(param, value);
    else next.delete(param);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
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
  );
}
