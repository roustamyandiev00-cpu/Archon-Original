-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260704015022
-- Production name: landingpage_storage_documents_crm
-- CRM landing: storage policies for documents bucket
-- Path pattern: {company_id}/{document_id}/{filename}

drop policy if exists "CRM members upload documents" on storage.objects;
create policy "CRM members upload documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and public.is_member_of_company((storage.foldername(name))[1]::bigint)
  );

drop policy if exists "CRM members read documents" on storage.objects;
create policy "CRM members read documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.is_member_of_company((storage.foldername(name))[1]::bigint)
  );

drop policy if exists "CRM members delete documents" on storage.objects;
create policy "CRM members delete documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and public.is_member_of_company((storage.foldername(name))[1]::bigint)
  );

