-- Newer Supabase projects don't grant privileges on new public tables automatically.
-- Only the server (secret / service_role key) touches these tables; the browser
-- gets realtime through broadcast and never queries them directly.
grant select, insert, update, delete on public.diagrams to service_role;
grant select, insert, update, delete on public.nodes to service_role;
grant select, insert, update, delete on public.edges to service_role;

revoke all on public.diagrams from anon, authenticated;
revoke all on public.nodes from anon, authenticated;
revoke all on public.edges from anon, authenticated;
