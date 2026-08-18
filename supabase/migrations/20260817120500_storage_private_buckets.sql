-- Resume/CV PDFs contain real PII (names, addresses, phone numbers) and were stored in PUBLIC
-- Storage buckets — anyone with the URL could read them with no login, entirely independent of
-- any RLS fix on the database tables. This closes that gap.
--
-- Both upload paths already lead with the user's id as the first path segment
-- (`${user.id}/resume_...pdf` in ProfileView.jsx/OnboardingFlow.jsx, `${user.id}/${appId}/...`
-- in ApplicationTracker.jsx), so (storage.foldername(name))[1] = auth.uid() works with no path
-- restructuring needed.

update storage.buckets set public = false where id in ('resumes', 'cvs');

create policy "resumes_own_folder_rw" on storage.objects
  for all to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cvs_own_folder_rw" on storage.objects
  for all to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- After applying: client call sites must switch from getPublicUrl() to
-- createSignedUrl(path, 3600) and store the storage PATH (not the public URL) going forward.
-- Existing rows with a stored public URL need the path backfilled by parsing it out of
-- `/storage/v1/object/public/<bucket>/<path>` — see AssetDrawer.jsx, which already does this
-- same parsing for a different purpose.
