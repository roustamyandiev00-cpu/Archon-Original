-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327175138
-- Production name: 018_add_facturen_table_fixed
-- Facturen table (compatibel met bestaand BIGINT schema)
CREATE TABLE IF NOT EXISTS facturen (
    id BIGSERIAL PRIMARY KEY,
    nummer VARCHAR(50) NOT NULL UNIQUE,
    bedrijf_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE RESTRICT,
    offerte_id BIGINT REFERENCES offertes(id) ON DELETE SET NULL,
    bedrag DECIMAL(12, 2) NOT NULL DEFAULT 0,
    btw_bedrag DECIMAL(12, 2) NOT NULL DEFAULT 0,
    totaal_bedrag DECIMAL(12, 2) NOT NULL DEFAULT 0,
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    vervaldatum DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'concept',
    betaald_op TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    notes TEXT,
    
    CONSTRAINT chk_factuur_status CHECK (status IN ('concept', 'verzonden', 'openstaand', 'deels_betaald', 'betaald', 'herinnering_verzonden', 'achterstallig', 'geannuleerd')),
    CONSTRAINT chk_factuur_dates CHECK (vervaldatum >= datum)
);

-- Indexes voor facturen
CREATE INDEX IF NOT EXISTS idx_facturen_bedrijf_id ON facturen(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_facturen_offerte_id ON facturen(offerte_id);
CREATE INDEX IF NOT EXISTS idx_facturen_status ON facturen(status);
CREATE INDEX IF NOT EXISTS idx_facturen_vervaldatum ON facturen(vervaldatum);
CREATE INDEX IF NOT EXISTS idx_facturen_datum ON facturen(datum);
CREATE INDEX IF NOT EXISTS idx_facturen_company_status ON facturen(bedrijf_id, status);

-- Enable RLS
ALTER TABLE facturen ENABLE ROW LEVEL SECURITY;

-- Trigger voor updated_at
CREATE OR REPLACE FUNCTION update_facturen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_facturen_updated_at ON facturen;
CREATE TRIGGER trigger_facturen_updated_at
  BEFORE UPDATE ON facturen
  FOR EACH ROW
  EXECUTE FUNCTION update_facturen_updated_at();

-- RLS Policies
CREATE POLICY "Facturen - interne gebruikers" ON facturen
  FOR ALL
  USING (
    bedrijf_id IN (
      SELECT id FROM bedrijven WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Facturen - portal users" ON facturen
  FOR SELECT
  USING (
    bedrijf_id IN (
      SELECT c.company_id FROM customers c
      JOIN customer_portal_users cpu ON c.id = cpu.customer_id
      WHERE cpu.auth_user_id = auth.uid() AND cpu.is_active = true
    )
  );

