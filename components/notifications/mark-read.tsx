"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/lib/actions/social";

// Marks everything read once the page has been seen. The list keeps its
// "new" highlight until the next visit, so the user can still spot what changed.
export function MarkNotificationsRead() {
  useEffect(() => {
    void markNotificationsRead();
  }, []);
  return null;
}
