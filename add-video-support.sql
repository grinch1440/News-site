
alter table articles add column if not exists video text;

insert into storage.buckets (id, name, public)
  values ('article-videos', 'article-videos', true)
  on conflict (id) do nothing;

create policy "public read article videos" on storage.objects
  for select using (bucket_id = 'article-videos');

create policy "public upload article videos" on storage.objects
  for insert with check (bucket_id = 'article-videos');
