-- Run after schema.sql in SQL Editor. All test users and records are rolled back.
begin;
select set_config('escape.test_staff', gen_random_uuid()::text, true);
select set_config('escape.test_outsider', gen_random_uuid()::text, true);
select set_config('escape.test_record', gen_random_uuid()::text, true);
insert into auth.users (id) values
  (current_setting('escape.test_staff')::uuid),
  (current_setting('escape.test_outsider')::uuid);
insert into public.escape_staff values (current_setting('escape.test_staff')::uuid);

set local role anon;
select id, nickname from public.escape_records limit 1;
do $$ begin
  begin
    insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
      values (current_setting('escape.test_record')::uuid, 'doll', 'test', 600, 0);
    raise exception 'FAIL: anonymous insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform staff_id from public.escape_records;
    raise exception 'FAIL: staff identity publicly readable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('escape.test_outsider'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  begin
    insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
      values (current_setting('escape.test_record')::uuid, 'doll', 'test', 600, 0);
    raise exception 'FAIL: non-staff insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.escape_staff values (current_setting('escape.test_outsider')::uuid);
    raise exception 'FAIL: self-enrollment allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('escape.test_staff'), 'role', 'authenticated')::text, true);
set local role authenticated;
insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
  values (current_setting('escape.test_record')::uuid, 'doll', 'test', 600, 0);
do $$ begin
  begin
    update public.escape_records set nickname = 'changed' where id = current_setting('escape.test_record')::uuid;
    raise exception 'FAIL: staff update allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.escape_records where id = current_setting('escape.test_record')::uuid;
    raise exception 'FAIL: staff delete allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
      values (gen_random_uuid(), 'invalid', 'test', -1, 0);
    raise exception 'FAIL: invalid record allowed';
  exception when check_violation then null; end;
end $$;
reset role;
delete from public.escape_staff where user_id = current_setting('escape.test_staff')::uuid;
set local role authenticated;
do $$ begin
  begin
    insert into public.escape_records (id, concept, nickname, total_seconds, penalty_seconds)
      values (gen_random_uuid(), 'doll', 'test', 600, 0);
    raise exception 'FAIL: revoked staff insert allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
