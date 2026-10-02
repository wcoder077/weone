"use client";

import { useEffect } from "react";
import { FEED_SEEN_COOKIE } from "@/lib/feed";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Remembers the newest post shown, so the next visit knows whether anything is new.
export function FeedSeenMarker({ newest }: { newest: string }) {
  useEffect(() => {
    document.cookie = `${FEED_SEEN_COOKIE}=${newest}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, [newest]);
  return null;
}
