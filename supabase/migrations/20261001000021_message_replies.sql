-- Replies: a message can quote an earlier message of the same chat.
-- If the quoted message is deleted, the reply stays and just loses the quote.

alter table public.messages
  add column reply_to uuid references public.messages (id) on delete set null;

create index messages_reply_to_idx on public.messages (reply_to) where reply_to is not null;

-- Same rules as before, plus: a reply must point at a message of the same conversation.
drop policy "messages: member sends in open conversation" on public.messages;
create policy "messages: member sends in open conversation"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and image_path is null
    and edited_at is null
    and public.is_conversation_member(conversation_id)
    and public.conversation_is_open(conversation_id)
    and public.grapheme_length(body) <= 4000
    and (attachment_path is null or public.attachment_object_exists(attachment_path))
    and (
      reply_to is null
      or exists (
        select 1 from public.messages r
        where r.id = messages.reply_to and r.conversation_id = messages.conversation_id
      )
    )
    and (
      kind = 'text' and project_id is null
      or kind = 'project_invite' and attachment_path is null and exists (
        select 1 from public.project_members m
        where m.project_id = messages.project_id and m.user_id = (select auth.uid())
      )
    )
  );
