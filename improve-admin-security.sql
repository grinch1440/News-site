-- ============================================================================
-- VANTAGE — real passcode security (run once in the SQL Editor)
-- Until now, the passcode was stored as plain text and readable by anyone
-- who queried the database directly, bypassing the login screen entirely.
-- This hashes it and makes sure it can never be read back out at all —
-- only checked, via a yes/no function.
-- ============================================================================

create extension if not exists pgcrypto;

-- Turn whatever passcode is currently stored into a secure hash
update site_settings
set passcode = crypt(passcode, gen_salt('bf'))
where id = 1 and passcode !~ '^\$2[aby]\$';

-- Checks a passcode attempt without ever exposing the real one
create or replace function check_admin_passcode(input text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from site_settings
    where id = 1 and passcode = crypt(input, passcode)
  );
$$;
grant execute on function check_admin_passcode(text) to anon, authenticated;

-- Changes the passcode, but only if the current one is supplied correctly
create or replace function set_admin_passcode(current_input text, new_passcode text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from site_settings where id = 1 and passcode = crypt(current_input, passcode)) then
    return false;
  end if;
  update site_settings set passcode = crypt(new_passcode, gen_salt('bf')) where id = 1;
  return true;
end;
$$;
grant execute on function set_admin_passcode(text, text) to anon, authenticated;

-- Stop the passcode column from ever being readable via the API at all
revoke select on site_settings from anon, authenticated;
grant select (id, brand_name, tagline) on site_settings to anon, authenticated;
grant update (brand_name, tagline) on site_settings to anon, authenticated;
