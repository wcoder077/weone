import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getAllSkills = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("skills")
    .select("id, name, category")
    .order("name");
  if (error) throw error;
  return data;
});

export type Skill = Awaited<ReturnType<typeof getAllSkills>>[number];

export async function getUserSkills(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_skills")
    .select("skill_id, level")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}
