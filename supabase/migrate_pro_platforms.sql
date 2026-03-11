-- Add substack and github to sources type constraint
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_type_check
    CHECK (type IN ('youtube', 'reddit', 'rss', 'twitter', 'bluesky', 'hackernews', 'tiktok', 'substack', 'github'));
