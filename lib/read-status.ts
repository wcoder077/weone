export type ReadStatus = "sent" | "read";

// A message of mine is read once the other person's last_read_at is at or after it.
// Compared as dates: Postgres and JS print timestamps differently.
export function readStatus(createdAt: string, otherReadAt: string | null | undefined): ReadStatus {
  return otherReadAt && Date.parse(otherReadAt) >= Date.parse(createdAt) ? "read" : "sent";
}
