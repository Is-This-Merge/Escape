-- Existing projects: run once in SQL Editor instead of re-running schema.sql.
-- Existing records and staff accounts are preserved. Safe to re-run.
begin;
alter table public.escape_records alter column staff_id drop not null;
grant insert (id, concept, nickname, total_seconds, penalty_seconds)
  on public.escape_records to anon, authenticated;
drop policy if exists staff_insert_records on public.escape_records;
drop policy if exists public_insert_records on public.escape_records;
create policy public_insert_records on public.escape_records for insert to anon, authenticated
  with check (staff_id is not distinct from (select auth.uid()));
-- UPDATE / DELETE privileges remain unchanged (blocked in the original schema).
commit;
