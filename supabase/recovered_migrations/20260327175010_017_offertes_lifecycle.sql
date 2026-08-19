-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327175010
-- Production name: 017_offertes_lifecycle
-- Migration: Document Lifecycle Management - Phase 1: Offertes Table Enhancement

-- Add lifecycle columns to offertes table
ALTER TABLE offertes 
ADD COLUMN IF NOT EXISTS status_new VARCHAR(50) DEFAULT 'concept',
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS versie_nummer INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS geldig_tot DATE,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add CHECK constraint for status_new values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_offerte_status_new'
    ) THEN
        ALTER TABLE offertes ADD CONSTRAINT chk_offerte_status_new 
        CHECK (status_new IN ('concept', 'verzonden', 'bekeken', 'geaccepteerd', 'afgewezen', 'verlopen'));
    END IF;
END $$;

-- Create index on status_new
CREATE INDEX IF NOT EXISTS idx_offertes_status_new ON offertes(status_new);
CREATE INDEX IF NOT EXISTS idx_offertes_geldig_tot ON offertes(geldig_tot);
CREATE INDEX IF NOT EXISTS idx_offertes_company_status ON offertes(bedrijf_id, status_new);

-- Backward compatibility: Create function to sync legacy status column
CREATE OR REPLACE FUNCTION sync_legacy_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status = CASE NEW.status_new
        WHEN 'concept' THEN 'concept'
        WHEN 'verzonden' THEN 'verstuurd'
        WHEN 'bekeken' THEN 'verstuurd'
        WHEN 'geaccepteerd' THEN 'geaccepteerd'
        WHEN 'afgewezen' THEN 'geweigerd'
        WHEN 'verlopen' THEN 'geweigerd'
        ELSE NEW.status
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Install trigger on offertes table for backward compatibility
DROP TRIGGER IF EXISTS trigger_sync_legacy_status ON offertes;
CREATE TRIGGER trigger_sync_legacy_status
    BEFORE INSERT OR UPDATE ON offertes
    FOR EACH ROW
    EXECUTE FUNCTION sync_legacy_status();

