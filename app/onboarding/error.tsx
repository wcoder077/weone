"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function OnboardingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[520px] px-4 pt-20">
      <ErrorState onRetry={retry} />
    </div>
  );
}
