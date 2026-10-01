import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { requireSupabaseEnv } from "./env";

export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
