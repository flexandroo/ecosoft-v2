-- Storage "remove" first selects the objects it deletes; without a SELECT
-- policy staff deletions silently removed nothing.
create policy "staff list media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and (select private.is_staff()));
