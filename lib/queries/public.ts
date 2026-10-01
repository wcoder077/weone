import { createClient } from "@/lib/supabase/server";

// FIX 2: Welcome-page previews for signed-out visitors. These security definer
// functions return only safe fields; the tables themselves stay closed to anon.
export async function getWelcomePreviews() {
  const supabase = await createClient();
  const [people, projects] = await Promise.all([
    supabase.rpc("public_people_preview", { p_limit: 2 }),
    supabase.rpc("public_projects_preview", { p_limit: 1 }),
  ]);
  if (people.error) throw people.error;
  if (projects.error) throw projects.error;
  return { people: people.data, projects: projects.data };
}
