"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { takeStale } from "@/lib/stale-pages";

// Reloads this page's data once if something new arrived since it was cached.
export function RefreshIfStale({ path }: { path: string }) {
  const router = useRouter();
  useEffect(() => {
    if (takeStale(path)) router.refresh();
  }, [path, router]);
  return null;
}
