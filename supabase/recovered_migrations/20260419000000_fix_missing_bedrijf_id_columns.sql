-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260419000000
-- Production name: fix_missing_bedrijf_id_columns
-- Migration: Add missing bedrijf_id columns to tables that reference bedrijven
-- Fixes 'column X.bedrijf_id does not exist' errors across multiple tables

-- projecten
ALTER TABLE projecten
  ADD COLUMN IF NOT EXISTS bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL;

-- Recovered statement 2
CREATE INDEX IF NOT EXISTS idx_projecten_bedrijf_id ON projecten(bedrijf_id);

-- Recovered statement 3
-- deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL;

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS idx_deals_bedrijf_id ON deals(bedrijf_id);

-- Recovered statement 5
-- contacten
ALTER TABLE contacten
  ADD COLUMN IF NOT EXISTS bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL;

-- Recovered statement 6
CREATE INDEX IF NOT EXISTS idx_contacten_bedrijf_id ON contacten(bedrijf_id);

-- Recovered statement 7
-- afspraken
ALTER TABLE afspraken
  ADD COLUMN IF NOT EXISTS bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL;

-- Recovered statement 8
CREATE INDEX IF NOT EXISTS idx_afspraken_bedrijf_id ON afspraken(bedrijf_id);

