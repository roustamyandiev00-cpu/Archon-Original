-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260411000000
-- Production name: add_offertes_bedrijf_id
-- Migration: Add bedrijf_id to offertes table (if missing)
-- Fixes 'column offertes.bedrijf_id does not exist' error

-- Add bedrijf_id column if not exists
ALTER TABLE offertes 
ADD COLUMN IF NOT EXISTS bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL;

-- Recovered statement 2
-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_offertes_bedrijf_id ON offertes(bedrijf_id);

-- Recovered statement 3
COMMENT ON COLUMN offertes.bedrijf_id IS 'Foreign key to bedrijven - required for RLS and filtering';

