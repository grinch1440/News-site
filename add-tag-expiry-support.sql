-- ============================================================================
-- VANTAGE — add auto-expiring Breaking/Trending tags (run once in SQL Editor)
-- Adds two optional timestamp columns. When set, the Breaking/Trending badge
-- stops showing after that time — the article itself is never deleted.
-- ============================================================================

alter table articles add column if not exists breaking_until timestamptz;
alter table articles add column if not exists trending_until timestamptz;
