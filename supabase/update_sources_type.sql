-- Update the 'sources' table to support new source types
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_type_check CHECK (type IN ('youtube', 'reddit', 'rss', 'bluesky', 'hackernews'));
