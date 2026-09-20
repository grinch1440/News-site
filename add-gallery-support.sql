alter table articles add column if not exists images jsonb default '[]'::jsonb;
