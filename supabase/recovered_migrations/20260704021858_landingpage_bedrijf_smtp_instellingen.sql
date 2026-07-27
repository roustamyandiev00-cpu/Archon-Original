-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260704021858
-- Production name: landingpage_bedrijf_smtp_instellingen
-- Per-bedrijf SMTP (SaaS: elke klant zijn eigen Gmail/mailserver)

create table if not exists public.bedrijf_smtp_instellingen (
  bedrijf_id bigint primary key references public.bedrijven (id) on delete cascade,
  smtp_host text not null default 'smtp.gmail.com',
  smtp_port integer not null default 587 check (smtp_port > 0 and smtp_port <= 65535),
  smtp_user text not null,
  smtp_pass text,
  from_email text not null,
  from_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_bedrijf_smtp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bedrijf_smtp_instellingen_updated_at on public.bedrijf_smtp_instellingen;
create trigger bedrijf_smtp_instellingen_updated_at
  before update on public.bedrijf_smtp_instellingen
  for each row execute function public.set_bedrijf_smtp_updated_at();

alter table public.bedrijf_smtp_instellingen enable row level security;

drop policy if exists "Company members manage smtp settings" on public.bedrijf_smtp_instellingen;
create policy "Company members manage smtp settings"
  on public.bedrijf_smtp_instellingen
  for all
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

revoke all on table public.bedrijf_smtp_instellingen from authenticated;
grant select (bedrijf_id, smtp_host, smtp_port, smtp_user, from_email, from_name, created_at, updated_at)
  on table public.bedrijf_smtp_instellingen to authenticated;
grant insert, update on table public.bedrijf_smtp_instellingen to authenticated;

create or replace view public.bedrijf_smtp_status
with (security_invoker = true) as
select
  bedrijf_id,
  smtp_host,
  smtp_port,
  smtp_user,
  from_email,
  from_name,
  (smtp_pass is not null and smtp_pass <> '') as has_password,
  updated_at
from public.bedrijf_smtp_instellingen;

grant select on public.bedrijf_smtp_status to authenticated;

