-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260512042512
-- Production name: remove_legacy_broken_rpc_access
revoke execute on function public.generate_storage_signed_url(text, text, integer) from authenticated;
revoke execute on function public.get_invoice_storage_path(uuid) from authenticated;
revoke execute on function public.get_project_file_storage_path(uuid, text) from authenticated;
revoke execute on function public.get_quotation_storage_path(uuid) from authenticated;
revoke execute on function public.log_document_download(uuid, text) from authenticated;

create or replace function public.log_offerte_activity(
  p_offerte_id bigint,
  p_company_id bigint,
  p_activity_type character varying,
  p_old_status character varying default null::character varying,
  p_new_status character varying default null::character varying,
  p_metadata jsonb default '{}'::jsonb,
  p_performed_by uuid default auth.uid()
)
returns bigint
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_activity_id bigint;
begin
  insert into public.offerte_activities (
    offerte_id,
    company_id,
    activity_type,
    old_status,
    new_status,
    metadata,
    performed_by
  ) values (
    p_offerte_id,
    p_company_id,
    p_activity_type,
    p_old_status,
    p_new_status,
    p_metadata,
    p_performed_by
  )
  returning id into v_activity_id;

  return v_activity_id;
end;
$$;

grant execute on function public.log_offerte_activity(bigint, bigint, character varying, character varying, character varying, jsonb, uuid) to authenticated;

