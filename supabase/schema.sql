-- Run in the Supabase SQL Editor as the project administrator.
begin;
create table public.escape_staff (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.escape_staff enable row level security;
revoke all on public.escape_staff from public, anon, authenticated;
grant select on public.escape_staff to authenticated;
create policy staff_read_self on public.escape_staff for select to authenticated
  using (user_id = (select auth.uid()));

create table public.escape_records (
  id uuid primary key,
  concept text not null check (concept in ('doll', 'hideout')),
  nickname text not null check (char_length(btrim(nickname)) between 1 and 12 and nickname = btrim(nickname)),
  total_seconds integer not null check (total_seconds >= 0),
  penalty_seconds integer not null check (penalty_seconds between 0 and 3000 and penalty_seconds % (case when concept = 'hideout' then 300 else 600 end) = 0),
  created_at timestamptz not null default now(),
  staff_id uuid default auth.uid() references auth.users(id),
  check (total_seconds >= penalty_seconds)
);
create index escape_records_ranking on public.escape_records (concept, total_seconds, created_at, id);
alter table public.escape_records enable row level security;
revoke all on public.escape_records from public, anon, authenticated;
-- Staff identity is not part of the public leaderboard.
grant select (id, concept, nickname, total_seconds, penalty_seconds, created_at)
  on public.escape_records to anon, authenticated;
grant insert (id, concept, nickname, total_seconds, penalty_seconds)
  on public.escape_records to anon, authenticated;
create policy public_read_records on public.escape_records for select to anon, authenticated using (true);
create policy public_insert_records on public.escape_records for insert to anon, authenticated
  with check (staff_id is not distinct from (select auth.uid()));
-- No UPDATE / DELETE grants or policies; manage records in the dashboard.
commit;
