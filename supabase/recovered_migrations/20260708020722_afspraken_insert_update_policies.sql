-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260708020722
-- Production name: afspraken_insert_update_policies
create policy "Allow authenticated insert on afspraken" on public.afspraken for insert to authenticated with check (exists (select 1 from company_memberships cm where cm.company_id = afspraken.bedrijf_id and cm.user_id = auth_user_id() and cm.is_active = true));

create policy "Allow authenticated update on afspraken" on public.afspraken for update to authenticated using (exists (select 1 from company_memberships cm where cm.company_id = afspraken.bedrijf_id and cm.user_id = auth_user_id() and cm.is_active = true)) with check (exists (select 1 from company_memberships cm where cm.company_id = afspraken.bedrijf_id and cm.user_id = auth_user_id() and cm.is_active = true));

