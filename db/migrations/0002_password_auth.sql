alter table users
  alter column google_subject drop not null;

alter table users
  add column if not exists password_hash text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_identity_check'
  ) then
    alter table users
      add constraint users_auth_identity_check
      check (google_subject is not null or password_hash is not null);
  end if;
end
$$;

alter table auth_sessions
  drop constraint if exists auth_sessions_auth_provider_check;

alter table auth_sessions
  add constraint auth_sessions_auth_provider_check
  check (auth_provider in ('google.com', 'password'));
