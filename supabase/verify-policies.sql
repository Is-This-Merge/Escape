-- Run after schema.sql OR allow-public-registration.sql. Tests are rolled back.
begin;
select set_config('escape.test_user', gen_random_uuid()::text, true);
select set_config('escape.test_record', gen_random_uuid()::text, true);
insert into auth.users (id) values (current_setting('escape.test_user')::uuid);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
  values (current_setting('escape.test_record')::uuid, 'doll', 'guest', 600, 0);
select id, nickname from public.escape_records where id = current_setting('escape.test_record')::uuid;
do $$ begin
  begin
    insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
      values (current_setting('escape.test_record')::uuid, 'doll', 'duplicate', 600, 0);
    raise exception 'FAIL: duplicate ID allowed';
  exception when unique_violation then null; end;
  begin
    insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
      values (gen_random_uuid(), 'invalid', 'test', -1, 0);
    raise exception 'FAIL: invalid record allowed';
  exception when check_violation then null; end;
  begin
    update public.escape_records set nickname = 'changed' where id = current_setting('escape.test_record')::uuid;
    raise exception 'FAIL: anonymous update allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.escape_records where id = current_setting('escape.test_record')::uuid;
    raise exception 'FAIL: anonymous delete allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform staff_id from public.escape_records;
    raise exception 'FAIL: staff identity publicly readable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select staff_id is not null from public.escape_records where id = current_setting('escape.test_record')::uuid) then
    raise exception 'FAIL: anonymous record has staff identity';
  end if;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('escape.test_user'), 'role', 'authenticated')::text, true);
set local role authenticated;
-- This account is deliberately not a member of escape_staff.
insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
  values (gen_random_uuid(), 'hideout', 'member', 700, 600);
do $$ begin
  begin
    update public.escape_records set nickname = 'changed' where id = current_setting('escape.test_record')::uuid;
    raise exception 'FAIL: authenticated update allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.escape_records where id = current_setting('escape.test_record')::uuid;
    raise exception 'FAIL: authenticated delete allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.escape_staff values (current_setting('escape.test_user')::uuid);
    raise exception 'FAIL: self-enrollment allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
