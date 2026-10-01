import { cache } from "react";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's profile, or null when signed out.
export const getMyProfile = cache(async () => {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
});

export type MyProfile = NonNullable<Awaited<ReturnType<typeof getMyProfile>>>;
