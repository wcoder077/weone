-- Lock down function EXECUTE grants (Supabase advisor 0028/0029).
-- Supabase grants EXECUTE on new public functions to anon and authenticated.
-- Trigger functions need no grant at all; RLS helpers are needed only by
-- signed-in users, because policies call them as the current role.

alter default privileges in schema public revoke execute on functions from public, anon;

revoke execute on function
  public.handle_new_user(),
  public.reset_journey_verification(),
  public.mark_journey_item_verified(),
  public.add_project_owner_member(),
  public.accept_join_request(),
  public.on_connection_change(),
  public.on_collab_request_change(),
  public.on_join_request_change(),
  public.on_project_member_added(),
  public.on_project_change(),
  public.on_journey_item_added(),
  public.on_journey_confirmed(),
  public.on_project_invite_sent()
from public, anon, authenticated;

revoke execute on function
  public.owns_journey_item(uuid),
  public.can_confirm_journey_item(uuid),
  public.is_project_owner(uuid),
  public.owns_project_role(uuid),
  public.is_conversation_member(uuid),
  public.owns_project_folder(text)
from public, anon;

grant execute on function
  public.owns_journey_item(uuid),
  public.can_confirm_journey_item(uuid),
  public.is_project_owner(uuid),
  public.owns_project_role(uuid),
  public.is_conversation_member(uuid),
  public.owns_project_folder(text)
to authenticated;
