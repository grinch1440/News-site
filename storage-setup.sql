-- Create a public storage bucket to hold article photos
insert into storage.buckets (id, name, public)
  values ('article-images', 'article-images', true)
  on conflict (id) do nothing;

-- Allow anyone to view uploaded images (needed so visitors can see them)
create policy "public read article images" on storage.objects
  for select using (bucket_id = 'article-images');

-- Allow uploads (gated by the app's admin passcode screen, same as articles)
create policy "public upload article images" on storage.objects
  for insert with check (bucket_id = 'article-images');
