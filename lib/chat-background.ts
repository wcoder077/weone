// The chat background is a personal choice kept on this device: a tint colour and the faint doodle pattern.
export type ChatBackground = { color: string | null; pattern: boolean };

export const DEFAULT_CHAT_BACKGROUND: ChatBackground = { color: null, pattern: true };
export const CHAT_BACKGROUND_KEY = "chat-background";

// Soft tints: they are mixed into the theme's own surface colour, so text stays readable in light and dark.
export const CHAT_TINTS = [
  { label: "Osmon", color: "#3d4bff" },
  { label: "Dengiz", color: "#14b8a6" },
  { label: "Qum", color: "#d6a85c" },
  { label: "Atirgul", color: "#e0607e" },
  { label: "Tosh", color: "#64748b" },
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

export function parseChatBackground(raw: string): ChatBackground {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return DEFAULT_CHAT_BACKGROUND;
    const { color, pattern } = value as { color?: unknown; pattern?: unknown };
    return {
      color: typeof color === "string" && HEX.test(color) ? color.toLowerCase() : null,
      pattern: pattern !== false,
    };
  } catch {
    return DEFAULT_CHAT_BACKGROUND;
  }
}

// Inline style for the message area: the tint over the surface, and the pattern switched on or off.
export function chatBackgroundStyle(background: ChatBackground): Record<string, string> {
  const style: Record<string, string> = {};
  if (background.color) {
    style.backgroundColor = `color-mix(in oklab, ${background.color} 16%, var(--surface))`;
    style["--chat-tint"] = `color-mix(in oklab, ${background.color} 24%, transparent)`;
  }
  if (!background.pattern) style["--chat-pattern"] = "none";
  return style;
}
