-- Diagram data moved from MongoDB. Users still live in MongoDB (next-auth),
-- so owner_id / shares hold the Mongo user id as text.
-- The API routes access these tables with the service role key, so RLS is
-- enabled with no policies: anon / authenticated roles get no direct access.

create table public.diagrams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id text not null,
  shares text[] not null default '{}',
  is_private boolean not null default false,
  provider text not null default 'SQLServer'
    check (provider in ('SQLServer', 'MySQL', 'PostgreeSQL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index diagrams_owner_id_idx on public.diagrams (owner_id);
create index diagrams_shares_idx on public.diagrams using gin (shares);

create table public.nodes (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.diagrams (id) on delete cascade,
  flow_id text not null, -- react flow node id
  position jsonb not null,
  index integer not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index nodes_diagram_id_idx on public.nodes (diagram_id);

create table public.edges (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.diagrams (id) on delete cascade,
  flow_id text not null, -- react flow edge id
  source text not null,
  source_handle text,
  target text not null,
  target_handle text,
  index integer not null default 0,
  color text not null,
  relation_type text not null,
  relationship_name text not null,
  is_auto_naming boolean not null default false,
  referential_action_for_update text not null,
  referential_action_for_delete text not null,
  target_selected_primary_or_unique_id text not null default '',
  source_column_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index edges_diagram_id_idx on public.edges (diagram_id);

alter table public.diagrams enable row level security;
alter table public.nodes enable row level security;
alter table public.edges enable row level security;

-- Realtime: broadcast every row change to a private topic per diagram
-- ("diagram:<id>"); the client listens to diagram_changed / node_changed / edge_changed.
create or replace function public.broadcast_diagram_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diagram uuid;
begin
  if tg_table_name = 'diagrams' then
    diagram := coalesce(new.id, old.id);
  else
    diagram := coalesce(new.diagram_id, old.diagram_id);
  end if;

  perform realtime.broadcast_changes(
    'diagram:' || diagram::text,
    case tg_table_name
      when 'diagrams' then 'diagram_changed'
      when 'nodes' then 'node_changed'
      else 'edge_changed'
    end,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

create trigger diagrams_broadcast after insert or update or delete
  on public.diagrams for each row execute function public.broadcast_diagram_changes();
create trigger nodes_broadcast after insert or update or delete
  on public.nodes for each row execute function public.broadcast_diagram_changes();
create trigger edges_broadcast after insert or update or delete
  on public.edges for each row execute function public.broadcast_diagram_changes();

-- Auth is next-auth (not Supabase Auth), so the browser connects as anon.
-- Topic names contain the diagram uuid, which acts as the capability to listen.
create policy "receive diagram broadcasts"
  on realtime.messages for select
  to anon, authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'diagram:%'
  );
