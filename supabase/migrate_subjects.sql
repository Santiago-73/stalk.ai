-- ============================
-- Stalk.ai – Subjects migration
-- Run this in the Supabase SQL Editor
-- ============================

-- 1. Subjects table
create table if not exists subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);

alter table subjects enable row level security;

create policy "Users can manage own subjects"
  on subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Add subject_id to sources (nullable — existing sources keep working)
alter table sources add column if not exists subject_id uuid references subjects(id) on delete cascade;

-- 3. Add subject_id to digests and make source_id nullable (subject digests have no single source)
alter table digests add column if not exists subject_id uuid references subjects(id) on delete set null;
alter table digests alter column source_id drop not null;

-- 4. Add tiktok to sources type check
alter table sources drop constraint if exists sources_type_check;
alter table sources add constraint sources_type_check
  check (type in ('youtube', 'reddit', 'rss', 'twitter', 'bluesky', 'hackernews', 'tiktok'));
