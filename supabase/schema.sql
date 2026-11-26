create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_titles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id bigint not null, media_type text not null check (media_type in ('movie','tv')),
  status text not null check (status in ('watchlist','watched','liked','dismissed','rated')),
  rating numeric(2,1) check (rating >= 0 and rating <= 10), updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type, status)
);
create table if not exists public.viewing_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id bigint not null, media_type text not null check (media_type in ('movie','tv')), viewed_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.user_titles enable row level security;
alter table public.viewing_history enable row level security;
create policy "Profiles are private to their owner" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "Titles are private to their owner" on public.user_titles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "History is private to its owner" on public.viewing_history for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id, display_name) values(new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1))); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
