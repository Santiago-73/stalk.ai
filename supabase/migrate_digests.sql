-- Run this in Supabase SQL Editor if you already have a digests table from before
-- If your digests table is empty / fresh, use schema.sql instead

alter table digests add column if not exists user_id uuid references profiles(id) on delete cascade;
alter table digests add column if not exists source_name text not null default '';
alter table digests add column if not exists source_type text not null default 'rss';

-- Drop old policy if it exists
drop policy if exists "Users can view digests of own sources" on digests;

-- New simpler policies
create policy if not exists "Users can view own digests"
  on digests for select using (auth.uid() = user_id);

create policy if not exists "Users can insert own digests"
  on digests for insert with check (auth.uid() = user_id);
