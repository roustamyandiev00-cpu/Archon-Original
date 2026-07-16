-- Fase 1 (§8.4): agent-pipeline status naast bestaande werkpost_status enum.
-- Bestaande enum (open|in_behandeling|gesloten|verlopen) blijft de publicatie-lifecycle.

alter table public.werkposts
  add column if not exists pipeline_status text null;

alter table public.werkposts
  drop constraint if exists werkposts_pipeline_status_check;
alter table public.werkposts
  add constraint werkposts_pipeline_status_check
  check (
    pipeline_status is null
    or pipeline_status in (
      'gevonden',
      'interesse_verstuurd',
      'reactie_ontvangen',
      'info_nodig',
      'gesprek_actief',
      'offerte_aangevraagd',
      'geaccepteerd',
      'afgewezen',
      'verlopen'
    )
  );

create index if not exists werkposts_pipeline_status_idx
  on public.werkposts (pipeline_status)
  where pipeline_status is not null;
