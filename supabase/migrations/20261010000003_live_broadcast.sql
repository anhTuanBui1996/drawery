-- Nodes / edges are identified by (diagram_id, flow_id), the id used by the flow on the client.
alter table public.nodes add constraint nodes_diagram_flow_key unique (diagram_id, flow_id);
alter table public.edges add constraint edges_diagram_flow_key unique (diagram_id, flow_id);

-- Live edits now travel client -> client over Broadcast, while the DB is saved
-- every few seconds. DB triggers would echo stale saved state over newer live
-- state, so only a deleted diagram is still announced from the database.
drop trigger if exists nodes_broadcast on public.nodes;
drop trigger if exists edges_broadcast on public.edges;
drop trigger if exists diagrams_broadcast on public.diagrams;
create trigger diagrams_broadcast after delete
  on public.diagrams for each row execute function public.broadcast_diagram_changes();

-- Clients may send broadcast messages on topics of diagrams they can view
create policy "send diagram broadcasts"
  on realtime.messages for insert
  to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and public.can_view_diagram(
      (select realtime.topic()),
      (select auth.jwt() ->> 'sub')
    )
  );
