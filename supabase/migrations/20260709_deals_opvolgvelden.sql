-- Leads/CRM: opvolgvelden op deals
--
-- Voegt contactgegevens en een notitieveld toe aan de deals-tabel, zodat de
-- opvolging (wie bellen, wanneer, waarover) direct op de kaart te zien is.
-- Het bestaande 'deadline'-veld wordt hergebruikt als "volgende opvolging".

alter table public.deals
  add column if not exists contactpersoon text,
  add column if not exists telefoon text,
  add column if not exists email text,
  add column if not exists notitie text,
  add column if not exists laatste_contact_op date;
