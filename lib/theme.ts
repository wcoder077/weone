// Theme preference: "system" follows prefers-color-scheme. Stored in localStorage;
// applied as <html data-theme="light|dark"> by THEME_SCRIPT before first paint.

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "weone-theme";
const CHANGE_EVENT = "weone-theme-change";

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Tizim" },
  { value: "light", label: "Yorug'" },
  { value: "dark", label: "Qorong'i" },
];

// Runs inline in <head>: sets the theme, then keeps "system" in sync with the OS.
export const THEME_SCRIPT = `(function(){var k="${THEME_STORAGE_KEY}",m=window.matchMedia("(prefers-color-scheme: dark)");function p(){try{return localStorage.getItem(k)||"system"}catch(e){return "system"}}function a(){var v=p();document.documentElement.setAttribute("data-theme",v==="system"?(m.matches?"dark":"light"):v)}a();m.addEventListener("change",a);window.addEventListener("${CHANGE_EVENT}",a)})()`;

function isPreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function setThemePreference(value: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Private mode etc.: the theme still applies for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeThemePreference(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
