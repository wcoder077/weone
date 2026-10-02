"use client";

import { toast as sonner } from "sonner";
import { tNow } from "@/components/i18n/i18n-provider";

type Message = Parameters<typeof sonner>[0];

// Same API as sonner's toast, but plain-text messages are translated into the current language
// (server action errors arrive in Uzbek; see lib/i18n/core.ts for how they are matched).
const tr = (message: Message) => (typeof message === "string" ? tNow(message) : message);

export const toast = {
  success: (message: Message, data?: Parameters<typeof sonner.success>[1]) => sonner.success(tr(message), data),
  error: (message: Message, data?: Parameters<typeof sonner.error>[1]) => sonner.error(tr(message), data),
  message: (message: Message, data?: Parameters<typeof sonner>[1]) => sonner(tr(message), data),
};
