-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260706030108
-- Production name: rls_tenant_hardening
-- 009 RLS tenant hardening: dicht cross-tenant leeslekken

drop policy if exists "Allow authenticated select on company_legal_entities" on public.company_legal_entities;
create policy "Members read own legal entities" on public.company_legal_entities for select to authenticated using (public.is_member_of_company(bedrijf_id));

drop policy if exists "Allow authenticated select on invoice_events" on public.invoice_events;
create policy "Members read own invoice events" on public.invoice_events for select to authenticated using (public.is_member_of_company(bedrijf_id));

drop policy if exists "Allow authenticated select on invoice_tax_breakdown" on public.invoice_tax_breakdown;
create policy "Members read own tax breakdown" on public.invoice_tax_breakdown for select to authenticated using (exists (select 1 from public.facturen f where f.id = invoice_tax_breakdown.invoice_id and public.is_member_of_company(f.bedrijf_id)));

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Members read own + colleague profiles" on public.profiles for select to authenticated using (id = auth.uid() or exists (select 1 from public.company_memberships m_self join public.company_memberships m_other on m_other.company_id = m_self.company_id where m_self.user_id = auth.uid() and m_self.is_active = true and m_other.user_id = profiles.id and m_other.is_active = true));

drop policy if exists "Authenticated can read document_audit_log" on public.document_audit_log;
create policy "Users read own document audit entries" on public.document_audit_log for select to authenticated using (user_id = auth.uid()::text);

drop policy if exists "Authenticated access to uren_registratie" on public.uren_registratie;
drop policy if exists "Authenticated access to uitnodigingen" on public.uitnodigingen;

