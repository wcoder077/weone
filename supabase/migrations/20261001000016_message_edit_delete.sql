-- Senders can edit and delete their own messages in open (accepted) chats.
-- Only `body` is writable; `edited_at` is set by trigger. Messages with an image
-- (connection-request first messages) keep their own edit/cancel flow.

grant update (body) on public.messages to authenticated;
grant delete on public.messages to authenticated;

create policy "messages: sender edits own text"
  on public.messages for update to authenticated
  using (
    sender_id = (select auth.uid())
    and kind = 'text'
    and image_path is null
    and public.conversation_is_open(conversation_id)
  )
  with check (
    sender_id = (select auth.uid())
    and public.grapheme_length(body) <= 4000
  );

create policy "messages: sender deletes own"
  on public.messages for delete to authenticated
  using (
    sender_id = (select auth.uid())
    and image_path is null
    and public.conversation_is_open(conversation_id)
  );

create function public.mark_message_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger on_message_edited
  before update on public.messages
  for each row execute function public.mark_message_edited();

revoke execute on function public.mark_message_edited() from public, anon, authenticated;
