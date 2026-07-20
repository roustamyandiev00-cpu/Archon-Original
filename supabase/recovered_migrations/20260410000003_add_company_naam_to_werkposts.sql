-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410000003
-- Production name: add_company_naam_to_werkposts
-- Add company_naam to werkposts to avoid join queries
-- Dit lost het performance probleem op

ALTER TABLE werkposts ADD COLUMN IF NOT EXISTS company_naam VARCHAR(255);

-- Recovered statement 2
-- Update bestaande werkposts met bedrijfsnaam
UPDATE werkposts w
SET company_naam = b.naam
FROM bedrijven b
WHERE w.company_id = b.id AND w.company_naam IS NULL;

-- Recovered statement 3
-- Trigger om company_naam automatisch in te vullen bij insert
CREATE OR REPLACE FUNCTION set_werkpost_company_naam()
RETURNS TRIGGER AS $$
BEGIN
  SELECT naam INTO NEW.company_naam
  FROM bedrijven
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 4
CREATE TRIGGER werkpost_set_company_naam
  BEFORE INSERT ON werkposts
  FOR EACH ROW
  EXECUTE FUNCTION set_werkpost_company_naam();

-- Recovered statement 5
COMMENT ON COLUMN werkposts.company_naam IS 'Denormalized company name for performance';

