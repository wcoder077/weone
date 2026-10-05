// Columns to select instead of "*". The generated `search` vectors (profiles, projects) are large,
// only the database needs them for searching, and every byte selected is paid for as traffic.
export const PROFILE_COLUMNS =
  "available, avatar_url, banner_path, banner_position, bio, city, created_at, full_name, headline, id, interests, is_online_ok, languages, looking_for, onboarded, open_to, username";

export const PROJECT_COLUMNS =
  "category, city, created_at, description, id, is_looking, is_online, logo_url, name, owner_id, slug, status, tagline";
