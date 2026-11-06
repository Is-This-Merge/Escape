-- Run once in the Supabase SQL Editor for an existing database.
begin;
-- A 60-second unit preserves old 5/10-minute records and runs spanning the
-- switch to 3-minute hints. New hideout hints add 180 seconds in the app.
alter table public.escape_records
  drop constraint if exists escape_records_penalty_seconds_check;
alter table public.escape_records
  add constraint escape_records_penalty_seconds_check
  check (penalty_seconds between 0 and 3000
    and penalty_seconds % (case when concept = 'hideout' then 60 else 600 end) = 0);
commit;

