
-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  total_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "own profile select" on public.profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Study sessions
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text,
  planned_minutes integer not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  distraction_count integer not null default 0,
  points_earned integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.study_sessions enable row level security;

create policy "own sessions select" on public.study_sessions for select using (auth.uid() = user_id);
create policy "own sessions insert" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "own sessions update" on public.study_sessions for update using (auth.uid() = user_id);

create index study_sessions_user_started_idx on public.study_sessions(user_id, started_at desc);
