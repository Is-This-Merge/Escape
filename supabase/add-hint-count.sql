-- Run in the Supabase SQL Editor before deploying the updated leaderboard.
begin;
alter table public.escape_records
  add column if not exists hint_count integer check (hint_count >= 0);
grant select (hint_count), insert (hint_count)
  on public.escape_records to anon, authenticated;
-- Historical counts cannot reliably be reconstructed after penalty changes.
commit;
