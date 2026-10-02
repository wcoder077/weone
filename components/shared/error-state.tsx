"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Nimadir xato ketdi",
  description = "Yuklab bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.",
  onRetry,
  className,
}: ErrorStateProps) {
  const t = useT();
  return (
    <div
      role="alert"
      className={cn(
        "bg-card border-border rounded-card flex flex-col items-center gap-3 border px-6 py-12 text-center",
        className,
      )}
    >
      <span className="bg-surface text-danger flex size-12 items-center justify-center rounded-full">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-muted max-w-sm text-[15px]">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          {t("Qayta urinish")}</Button>
      ) : null}
    </div>
  );
}
