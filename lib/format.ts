const MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

// "2026-03-14" -> "Mart 2026"
export function formatMonth(date: string) {
  const [year, month] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start) return null;
  if (!end) return `${formatMonth(start)} – hozir`;
  if (start.slice(0, 7) === end.slice(0, 7)) return formatMonth(start);
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

// Relative time for feeds and notifications: "hozirgina", "5 daqiqa oldin", "3 kun oldin", "12 Mart".
export function formatRelative(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "hozirgina";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// "14:05" for chat bubbles.
export function formatTime(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Day separators in chat: "Bugun", "Kecha", "12 Mart" (+ year when not this year).
export function formatDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (days === 0) return "Bugun";
  if (days === 1) return "Kecha";
  const label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label} ${date.getFullYear()}`;
}

// Counters for likes, comments, views: 999, 1,2K, 15K, 3,4M.
export function formatCount(n: number) {
  if (n < 1000) return String(n);
  const [value, suffix] = n < 1_000_000 ? [n / 1000, "K"] : [n / 1_000_000, "M"];
  const text = value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "").replace(".", ",");
  return `${text}${suffix}`;
}
