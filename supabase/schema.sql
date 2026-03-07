-- ============================
-- Stalk.ai – Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================

-- Profiles table (auto-created on signup via trigger)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'pro', 'ultra')),
  stripe_customer_id text unique,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Sources table
create table if not exists sources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('youtube', 'reddit', 'rss')),
  url text not null,
  created_at timestamptz default now()
);

alter table sources enable row level security;

create policy "Users can manage own sources"
  on sources for all
  using (auth.uid() = user_id);

-- Digests table
create table if not exists digests (
  id uuid default gen_random_uuid() primary key,
  source_id uuid references sources(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  source_name text not null default '',
  source_type text not null default 'rss',
  content text not null,
  created_at timestamptz default now()
);

alter table digests enable row level security;

create policy "Users can view own digests"
  on digests for select using (auth.uid() = user_id);

create policy "Users can insert own digests"
  on digests for insert with check (auth.uid() = user_id);

-- Subscriptions table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  stripe_subscription_id text unique,
  status text check (status in ('active', 'canceled', 'past_due', 'trialing')),
  plan text check (plan in ('free', 'pro', 'ultra')),
  current_period_end timestamptz,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Auto-create profile on signup trigger
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
