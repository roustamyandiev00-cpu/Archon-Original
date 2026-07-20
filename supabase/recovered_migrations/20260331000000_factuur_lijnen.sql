-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260331000000
-- Production name: factuur_lijnen
-- Create factuur_lijnen table
CREATE TABLE IF NOT EXISTS factuur_lijnen (
  id BIGSERIAL PRIMARY KEY,
  factuur_id BIGINT NOT NULL REFERENCES facturen(id) ON DELETE CASCADE,
  omschrijving TEXT NOT NULL,
  aantal NUMERIC(10, 2) NOT NULL DEFAULT 1,
  eenheid TEXT NOT NULL DEFAULT 'stuks',
  prijs_per_eenheid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  btw_percentage NUMERIC(5, 2) NOT NULL DEFAULT 21,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recovered statement 2
-- Add indexes
CREATE INDEX idx_factuur_lijnen_factuur_id ON factuur_lijnen(factuur_id);

-- Recovered statement 3
CREATE INDEX idx_factuur_lijnen_sort_order ON factuur_lijnen(factuur_id, sort_order);

-- Recovered statement 4
-- Add updated_at trigger
CREATE TRIGGER set_factuur_lijnen_updated_at
  BEFORE UPDATE ON factuur_lijnen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 5
-- Add RLS policies
ALTER TABLE factuur_lijnen ENABLE ROW LEVEL SECURITY;

-- Recovered statement 6
-- Policy: Users can view factuur lijnen if they can view the factuur
CREATE POLICY "Users can view factuur lijnen if they can view the factuur"
  ON factuur_lijnen
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM facturen f
      WHERE f.id = factuur_lijnen.factuur_id
      AND EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = f.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
      )
    )
  );

-- Recovered statement 7
-- Policy: Users can insert factuur lijnen if they can edit the factuur
CREATE POLICY "Users can insert factuur lijnen if they can edit the factuur"
  ON factuur_lijnen
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facturen f
      WHERE f.id = factuur_lijnen.factuur_id
      AND EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = f.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
      )
    )
  );

-- Recovered statement 8
-- Policy: Users can update factuur lijnen if they can edit the factuur
CREATE POLICY "Users can update factuur lijnen if they can edit the factuur"
  ON factuur_lijnen
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM facturen f
      WHERE f.id = factuur_lijnen.factuur_id
      AND EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = f.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
      )
    )
  );

-- Recovered statement 9
-- Policy: Users can delete factuur lijnen if they can edit the factuur
CREATE POLICY "Users can delete factuur lijnen if they can edit the factuur"
  ON factuur_lijnen
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM facturen f
      WHERE f.id = factuur_lijnen.factuur_id
      AND EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = f.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
      )
    )
  );

