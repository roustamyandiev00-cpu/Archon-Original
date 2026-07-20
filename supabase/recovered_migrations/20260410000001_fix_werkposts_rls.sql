-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410000001
-- Production name: fix_werkposts_rls
-- Fix RLS policies voor werkposts zodat ook niet-ingelogde gebruikers kunnen lezen

-- Drop oude policy
DROP POLICY IF EXISTS "Werkposts zijn zichtbaar voor alle bedrijven" ON werkposts;

-- Recovered statement 2
-- Nieuwe policy: iedereen (ook niet-ingelogd) kan actieve werkposts lezen
CREATE POLICY "Werkposts zijn publiek zichtbaar"
  ON werkposts FOR SELECT
  USING (is_actief = true);

-- Recovered statement 3
-- Ook reacties moeten leesbaar zijn voor iedereen
DROP POLICY IF EXISTS "Reacties zijn zichtbaar voor werkpost eigenaar en reageerder" ON werkpost_reacties;

-- Recovered statement 4
CREATE POLICY "Reacties zijn zichtbaar voor iedereen"
  ON werkpost_reacties FOR SELECT
  USING (true);

