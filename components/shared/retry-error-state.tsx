"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "./error-state";

// Error state for a server-rendered section: retry re-fetches the page data.
export function RetryErrorState({ title, description }: { title?: string; description?: string }) {
  const router = useRouter();
  return <ErrorState title={title} description={description} onRetry={() => router.refresh()} />;
}
