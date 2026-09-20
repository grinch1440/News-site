create table if not exists articles (
  id text primary key,
  title text not null,
  dek text,
  category text,
  author text,
  dateline text,
  published_at timestamptz not null default now(),
  image text,
  breaking boolean default false,
  trending boolean default false,
  featured boolean default false,
  type text default 'news',
  body jsonb default '[]'::jsonb
);

create table if not exists site_settings (
  id int primary key default 1,
  brand_name text default 'VANTAGE',
  tagline text default 'Independent reporting. A wider view.',
  passcode text default 'editor2026'
);
insert into site_settings (id, brand_name, tagline, passcode)
  values (1, 'VANTAGE', 'Independent reporting. A wider view.', 'editor2026')
  on conflict (id) do nothing;

create table if not exists comments (
  id text primary key,
  article_id text references articles(id) on delete cascade,
  name text not null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists messages (
  id text primary key,
  name text not null,
  email text not null,
  subject text,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists subscribers (
  id text primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- Row Level Security: allow the public "anon" key to read/write.
-- (The admin passcode in the app UI is the only gate on writes — see the README caveat.)
alter table articles enable row level security;
alter table site_settings enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table subscribers enable row level security;

create policy "public read articles" on articles for select using (true);
create policy "public write articles" on articles for insert with check (true);
create policy "public update articles" on articles for update using (true);
create policy "public delete articles" on articles for delete using (true);

create policy "public read settings" on site_settings for select using (true);
create policy "public update settings" on site_settings for update using (true);

create policy "public read comments" on comments for select using (true);
create policy "public write comments" on comments for insert with check (true);

create policy "public write messages" on messages for insert with check (true);
create policy "public read messages" on messages for select using (true);

create policy "public write subscribers" on subscribers for insert with check (true);
create policy "public read subscribers" on subscribers for select using (true);
