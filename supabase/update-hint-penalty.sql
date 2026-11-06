-- Run once in the Supabase SQL Editor for an existing database.
begin;
alter table public.escape_records
  drop constraint if exists escape_records_penalty_seconds_check;
alter table public.escape_records
  add constraint escape_records_penalty_seconds_check
  check (penalty_seconds between 0 and 3000
    and penalty_seconds % (case when concept = 'hideout' then 300 else 600 end) = 0);
commit;
