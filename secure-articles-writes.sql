-- ============================================================================
-- VANTAGE — lock down direct article writes (run once in SQL Editor)
-- Currently anon/authenticated can INSERT/UPDATE/DELETE articles directly via
-- the API, with no passcode check at the database level (the passcode screen
-- only hides buttons in the browser). This migration closes that: writes must
-- now go through passcode-checked functions, same pattern as site_settings.
-- Run each numbered block separately if pasting the whole file at once fails.
-- ============================================================================

-- 1. Create an article, only if the passcode matches.
create or replace function create_article(
  input text,
  p_id text, p_title text, p_dek text, p_category text, p_author text,
  p_dateline text, p_published_at timestamptz, p_image text, p_images jsonb,
  p_video text, p_breaking boolean, p_trending boolean, p_featured boolean,
  p_type text, p_body jsonb, p_breaking_until timestamptz, p_trending_until timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from site_settings where id = 1 and passcode = crypt(input, passcode)) then
    return false;
  end if;
  insert into articles (
    id, title, dek, category, author, dateline, published_at, image, images,
    video, breaking, trending, featured, type, body, breaking_until, trending_until
  ) values (
    p_id, p_title, p_dek, p_category, p_author, p_dateline,
    coalesce(p_published_at, now()), p_image, coalesce(p_images, '[]'::jsonb),
    p_video, coalesce(p_breaking, false), coalesce(p_trending, false),
    coalesce(p_featured, false), coalesce(p_type, 'news'), coalesce(p_body, '[]'::jsonb),
    p_breaking_until, p_trending_until
  );
  return true;
end;
$$;

grant execute on function create_article(
  text, text, text, text, text, text, text, timestamptz, text, jsonb,
  text, boolean, boolean, boolean, text, jsonb, timestamptz, timestamptz
) to anon, authenticated;

-- 2. Update an article, only if the passcode matches.
create or replace function update_article(
  input text, p_id text, p_title text, p_dek text, p_category text, p_author text,
  p_dateline text, p_image text, p_images jsonb, p_video text,
  p_breaking boolean, p_trending boolean, p_featured boolean,
  p_type text, p_body jsonb, p_breaking_until timestamptz, p_trending_until timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from site_settings where id = 1 and passcode = crypt(input, passcode)) then
    return false;
  end if;
  update articles set
    title = p_title, dek = p_dek, category = p_category, author = p_author,
    dateline = p_dateline, image = p_image, images = coalesce(p_images, '[]'::jsonb),
    video = p_video, breaking = coalesce(p_breaking, false), trending = coalesce(p_trending, false),
    featured = coalesce(p_featured, false), type = coalesce(p_type, 'news'),
    body = coalesce(p_body, '[]'::jsonb),
    breaking_until = p_breaking_until, trending_until = p_trending_until
  where id = p_id;
  return true;
end;
$$;

grant execute on function update_article(
  text, text, text, text, text, text, text, text, jsonb, text,
  boolean, boolean, boolean, text, jsonb, timestamptz, timestamptz
) to anon, authenticated;

-- 3. Delete an article, only if the passcode matches.
create or replace function delete_article(input text, p_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from site_settings where id = 1 and passcode = crypt(input, passcode)) then
    return false;
  end if;
  delete from articles where id = p_id;
  return true;
end;
$$;

grant execute on function delete_article(text, text) to anon, authenticated;

-- 4. Revoke direct write access to articles — reads stay public, but writes
--    now only happen through the three functions above.
revoke insert, update, delete, truncate, references, trigger
on articles
from anon, authenticated;
