-- Migration: Add new source types (twitter, bluesky, hackernews)
-- Run this in Supabase SQL Editor to update the sources table constraint

-- Drop the old constraint
ALTER TABLE sources DROP CONSTRAINT sources_type_check;

-- Add new constraint with all source types
ALTER TABLE sources ADD CONSTRAINT sources_type_check 
  CHECK (type in ('youtube', 'reddit', 'rss', 'twitter', 'bluesky', 'hackernews'));

-- Verify the migration
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'sources' AND constraint_type = 'CHECK';
