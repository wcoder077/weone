-- Accepting a collaboration request opens a chat and posts the request's
-- message as the first message, from its sender (spec page 14). Clients can
-- only send messages as themselves, so this runs as one security definer step.

create function public.accept_collab_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.collab_requests%rowtype;
  conversation uuid;
begin
  select * into request
  from public.collab_requests
  where id = p_request_id
  for update;

  if request.id is null or request.receiver_id is distinct from auth.uid() then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  if request.status <> 'pending' then
    raise exception 'request already answered' using errcode = '22023';
  end if;

  update public.collab_requests set status = 'accepted' where id = p_request_id;

  -- Now allowed: an accepted collab request exists between the two users.
  conversation := public.start_conversation(request.sender_id);

  if coalesce(trim(request.message), '') <> '' then
    insert into public.messages (conversation_id, sender_id, body, created_at)
    values (conversation, request.sender_id, request.message, request.created_at);
  end if;

  return conversation;
end;
$$;

revoke execute on function public.accept_collab_request(uuid) from public, anon;
grant execute on function public.accept_collab_request(uuid) to authenticated;
