create table if not exists schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  google_subject text not null unique,
  email text not null,
  name text not null,
  avatar_url text,
  email_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on users (lower(email));

create table if not exists auth_sessions (
  token_hash char(64) primary key,
  user_id uuid not null references users(id) on delete cascade,
  auth_provider text not null check (auth_provider = 'google.com'),
  auth_time timestamptz not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists auth_sessions_user_idx on auth_sessions (user_id);
create index if not exists auth_sessions_expiry_idx on auth_sessions (expires_at);

create table if not exists app_records (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists app_records_user_idx
  on app_records (collection, (data ->> 'userId'));
create index if not exists app_records_interview_idx
  on app_records (collection, (data ->> 'interviewId'));
create index if not exists app_records_visibility_idx
  on app_records (collection, (data ->> 'visibility'));
create index if not exists app_records_created_idx
  on app_records (collection, created_at desc);

create table if not exists rate_limits (
  key_hash char(64) primary key,
  bucket text not null,
  count integer not null check (count >= 0),
  reset_at timestamptz not null,
  expires_at timestamptz not null
);

create index if not exists rate_limits_expiry_idx on rate_limits (expires_at);

create table if not exists usage_quotas (
  user_id uuid not null references users(id) on delete cascade,
  feature text not null,
  day date not null,
  count integer not null check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, day)
);

create table if not exists account_deletion_requests (
  id char(64) primary key,
  user_id text not null,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  expires_at timestamptz not null
);

create index if not exists account_deletion_expiry_idx
  on account_deletion_requests (expires_at);
