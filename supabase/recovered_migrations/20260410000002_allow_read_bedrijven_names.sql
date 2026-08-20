-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410000002
-- Production name: allow_read_bedrijven_names
-- Allow reading company names for werkposts display
-- Iedereen moet bedrijfsnamen kunnen zien voor werkposts

CREATE POLICY "Allow reading company names for werkposts"
  ON bedrijven
  FOR SELECT
  USING (true);

