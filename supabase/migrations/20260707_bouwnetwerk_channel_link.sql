-- Bouwnetwerk: koppel een geaccepteerde werkpost-reactie aan een chatkanaal.
--
-- Toegepast op vqiyftyqfpfbpwhadpvn via de Management API op 2026-07-08.
-- Dit bestand staat in de repo als documentatie/herhaalbare migratie —
-- bv. om lokaal of in een ander (staging) project hetzelfde te draaien.
--
-- De tabellen werkposts / werkpost_reacties / werkpost_views en
-- bouwnetwerk_channels / bouwnetwerk_channel_members / bouwnetwerk_messages
-- / bouwnetwerk_typing bestonden al, met nette RLS-policies (app_private.
-- is_company_member / is_bouwnetwerk_channel_member). Er ontbrak alleen een
-- directe link tussen een geaccepteerde reactie en het chatkanaal, en één
-- policy voor de accept-flow (zie hieronder).

alter table public.bouwnetwerk_channels
  add column if not exists werkpost_id uuid references public.werkposts(id),
  add column if not exists werkpost_reactie_id uuid references public.werkpost_reacties(id);

create unique index if not exists bouwnetwerk_channels_werkpost_reactie_id_key
  on public.bouwnetwerk_channels (werkpost_reactie_id)
  where werkpost_reactie_id is not null;

create index if not exists werkpost_reacties_werkpost_id_idx
  on public.werkpost_reacties (werkpost_id);

create index if not exists bouwnetwerk_channel_members_channel_id_idx
  on public.bouwnetwerk_channel_members (channel_id);

create index if not exists bouwnetwerk_messages_channel_id_idx
  on public.bouwnetwerk_messages (channel_id);

-- De bestaande insert-policy op bouwnetwerk_channel_members
-- ("bouwnetwerk_channel_members_insert_company_member") staat alleen toe dat
-- je een lidmaatschapsrij voor je EIGEN bedrijf toevoegt
-- (app_private.is_company_member(company_id)). Logisch als basisregel, maar
-- daardoor kan de eigenaar van een werkpost, bij het accepteren van een
-- reactie, de tegenpartij niet als lid toevoegen aan het kanaal dat hij net
-- zelf heeft aangemaakt.
--
-- Deze policy is permissive en komt bovenop de bestaande (ze worden met OR
-- gecombineerd): de aanmaker van een kanaal mag om het even welk bedrijf als
-- lid toevoegen aan een kanaal dat hijzelf heeft aangemaakt. Alleen relevant
-- voor kanalen die je zelf aanmaakt, dus geen opening om jezelf toe te voegen
-- aan andermans kanalen.
drop policy if exists "bouwnetwerk_channel_members_insert_by_channel_creator" on public.bouwnetwerk_channel_members;
create policy "bouwnetwerk_channel_members_insert_by_channel_creator"
  on public.bouwnetwerk_channel_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.bouwnetwerk_channels ch
      where ch.id = bouwnetwerk_channel_members.channel_id
        and app_private.is_company_member(ch.created_by_company_id)
    )
  );

-- Zelfde soort gat bij werkpost_reacties: de bestaande UPDATE-policy
-- ("Bedrijven kunnen eigen reacties wijzigen") staat alleen toe dat het
-- bedrijf dat de reactie plaatste, die reactie bewerkt. Maar accepteren/
-- afwijzen gebeurt door de eigenaar van de werkpost (een ander bedrijf) —
-- zonder onderstaande policy zou die update stilzwijgend 0 rijen raken.
drop policy if exists "werkpost_reacties_update_by_werkpost_owner" on public.werkpost_reacties;
create policy "werkpost_reacties_update_by_werkpost_owner"
  on public.werkpost_reacties for update
  to authenticated
  using (
    exists (
      select 1 from public.werkposts w
      where w.id = werkpost_reacties.werkpost_id
        and w.company_id in (
          select company_id from public.company_memberships
          where user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.werkposts w
      where w.id = werkpost_reacties.werkpost_id
        and w.company_id in (
          select company_id from public.company_memberships
          where user_id = auth.uid()
        )
    )
  );

-- Alleen de kanaal-aanmaker mag van de bestaande policy het kanaal updaten
-- (bouwnetwerk_channels_update_creator_company). Maar de sendMessage-action
-- update last_message_at bij elk bericht, ook vanuit de tegenpartij — zonder
-- onderstaande policy zou die update daar stilzwijgend niets doen.
drop policy if exists "bouwnetwerk_channels_update_member" on public.bouwnetwerk_channels;
create policy "bouwnetwerk_channels_update_member"
  on public.bouwnetwerk_channels for update
  to authenticated
  using (app_private.is_bouwnetwerk_channel_member(id))
  with check (app_private.is_bouwnetwerk_channel_member(id));

-- Realtime aanzetten voor de chatberichten (nodig voor de live chat in Comms).
alter publication supabase_realtime add table public.bouwnetwerk_messages;
