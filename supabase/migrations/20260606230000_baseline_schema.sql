-- Baseline schema for a fresh project. Tables already exist on the production
-- project (created before migrations were tracked), so every statement here
-- is idempotent (`if not exists`) and safely no-ops there.
--
-- Reconstructed from the frontend's Database types (src/lib/supabase.ts) and
-- the exact columns the save-activity Edge Function reads/writes.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.skills_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text,
  match_percentage integer,
  skills_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_score integer,
  result_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text,
  score integer,
  questions_count integer,
  created_at timestamptz not null default now()
);

create index if not exists skills_scans_user_created_idx on public.skills_scans (user_id, created_at desc);
create index if not exists resume_scores_user_created_idx on public.resume_scores (user_id, created_at desc);
create index if not exists interview_sessions_user_created_idx on public.interview_sessions (user_id, created_at desc);
