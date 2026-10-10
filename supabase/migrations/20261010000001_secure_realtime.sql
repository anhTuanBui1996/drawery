-- Replace the open anon policy: the browser now connects with a short-lived
-- JWT minted by /api/realtime/token (role authenticated, sub = Mongo user id).
drop policy if exists "receive diagram broadcasts" on realtime.messages;

-- Mirrors the API rule: a private diagram is only visible to its owner.
-- security definer because diagrams has RLS enabled and no policies.
create or replace function public.can_view_diagram(topic text, uid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.diagrams d
    where d.id::text = substring(topic from '^diagram:([0-9a-fA-F-]{36})$')
      and (not d.is_private or d.owner_id = uid)
  );
$$;

revoke execute on function public.can_view_diagram(text, text) from public, anon;
grant execute on function public.can_view_diagram(text, text) to authenticated;

create policy "receive diagram broadcasts"
  on realtime.messages for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and public.can_view_diagram(
      (select realtime.topic()),
      (select auth.jwt() ->> 'sub')
    )
  );
