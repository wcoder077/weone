-- Chat attachments: photos, videos and files (≤ 20 MB) in a private bucket.
-- Path: <sender id>/<conversation id>/<uuid>.<ext>. Readable by members of the conversation.
--
-- Changing the limits later: edit lib/attachments.ts AND run, for example:
--   update storage.buckets
--   set file_size_limit = 52428800,                       -- bytes (Supabase Free allows at most 50 MB)
--       allowed_mime_types = array['image/png', ...]      -- keep in sync with ATTACHMENT_TYPES
--   where id = 'message-attachments';

alter table public.messages
  add column attachment_path text,
  add column attachment_name text check (char_length(attachment_name) between 1 and 120),
  add column attachment_type text check (attachment_type in ('image', 'video', 'file')),
  add column attachment_size integer check (attachment_size > 0),
  add constraint messages_attachment_all_or_none check (
    (attachment_path is null and attachment_name is null and attachment_type is null and attachment_size is null)
    or (attachment_path is not null and attachment_name is not null and attachment_type is not null
        and attachment_size is not null and image_path is null and kind = 'text')
  ),
  -- <sender>/<conversation>/<uuid>.<ext>
  add constraint messages_attachment_path_format check (
    attachment_path is null
    or attachment_path = sender_id::text || '/' || conversation_id::text || '/' || substring(attachment_path from '[^/]+$')
       and attachment_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.[a-z0-9]{1,5}$'
  ),
  drop constraint messages_content_check,
  add constraint messages_content_check check (
    (kind = 'text' and (char_length(trim(body)) > 0 or image_path is not null or attachment_path is not null))
    or kind = 'project_invite'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments', 'message-attachments', false, 20971520,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'text/plain', 'text/csv', 'application/zip',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do nothing;

-- Lets the messages policy check that the uploaded object really exists.
create function public.attachment_object_exists(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from storage.objects o
    where o.bucket_id = 'message-attachments' and o.name = p_path
  );
$$;

create function public.can_read_message_attachment(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.messages m
    join public.conversation_members cm on cm.conversation_id = m.conversation_id
    where m.attachment_path = object_name and cm.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.attachment_object_exists(text) from public, anon;
revoke execute on function public.can_read_message_attachment(text) from public, anon;
grant execute on function public.attachment_object_exists(text) to authenticated;
grant execute on function public.can_read_message_attachment(text) to authenticated;

create policy "message-attachments: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'message-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "message-attachments: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'message-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "message-attachments: owner or conversation members read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'message-attachments'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.can_read_message_attachment(name))
  );

-- Sending: same rules as text, plus the attachment must be an existing upload of the sender
-- (the path format check above already ties it to sender and conversation).
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
      kind = 'text' and project_id is null
      or kind = 'project_invite' and attachment_path is null and exists (
        select 1 from public.project_members m
        where m.project_id = messages.project_id and m.user_id = (select auth.uid())
      )
    )
  );

-- Attachment messages are not editable (delete and resend instead).
drop policy "messages: sender edits own text" on public.messages;
create policy "messages: sender edits own text"
  on public.messages for update to authenticated
  using (
    sender_id = (select auth.uid())
    and kind = 'text'
    and image_path is null
    and attachment_path is null
    and public.conversation_is_open(conversation_id)
  )
  with check (
    sender_id = (select auth.uid())
    and public.grapheme_length(body) <= 4000
  );
