-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327174810
-- Production name: 002_initial_schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bedrijven table
CREATE TABLE IF NOT EXISTS bedrijven (
  id BIGSERIAL PRIMARY KEY,
  naam VARCHAR(255) NOT NULL,
  adres TEXT,
  postcode VARCHAR(10),
  stad VARCHAR(100),
  email VARCHAR(255),
  telefoon VARCHAR(20),
  kvk VARCHAR(20),
  btw VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacten table
CREATE TABLE IF NOT EXISTS contacten (
  id BIGSERIAL PRIMARY KEY,
  voornaam VARCHAR(100) NOT NULL,
  achternaam VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telefoon VARCHAR(20),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  functie VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255) NOT NULL,
  waarde DECIMAL(12, 2) DEFAULT 0,
  stadium VARCHAR(50) NOT NULL CHECK (stadium IN ('Lead', 'Gekwalificeerd', 'Voorstel', 'Onderhandeling', 'Gewonnen', 'Verloren')),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  deadline DATE,
  kans INTEGER DEFAULT 50 CHECK (kans >= 0 AND kans <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projecten table
CREATE TABLE IF NOT EXISTS projecten (
  id BIGSERIAL PRIMARY KEY,
  naam VARCHAR(255) NOT NULL,
  beschrijving TEXT,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Actief', 'On Hold', 'Afgerond')),
  voortgang INTEGER DEFAULT 0 CHECK (voortgang >= 0 AND voortgang <= 100),
  deadline DATE,
  budget DECIMAL(12, 2) DEFAULT 0,
  budget_gebruikt DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offertes table
CREATE TABLE IF NOT EXISTS offertes (
  id BIGSERIAL PRIMARY KEY,
  nummer VARCHAR(50) NOT NULL UNIQUE,
  klant VARCHAR(255) NOT NULL,
  bedrag DECIMAL(12, 2) NOT NULL,
  datum DATE NOT NULL,
  geldig_tot DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Openstaand', 'Geaccepteerd', 'Afgewezen')),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bedrijven_updated_at ON bedrijven;
CREATE TRIGGER update_bedrijven_updated_at
  BEFORE UPDATE ON bedrijven
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacten_updated_at ON contacten;
CREATE TRIGGER update_contacten_updated_at
  BEFORE UPDATE ON contacten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projecten_updated_at ON projecten;
CREATE TRIGGER update_projecten_updated_at
  BEFORE UPDATE ON projecten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_offertes_updated_at ON offertes;
CREATE TRIGGER update_offertes_updated_at
  BEFORE UPDATE ON offertes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bedrijven_naam ON bedrijven(naam);
CREATE INDEX IF NOT EXISTS idx_contacten_achternaam ON contacten(achternaam);
CREATE INDEX IF NOT EXISTS idx_deals_stadium ON deals(stadium);
CREATE INDEX IF NOT EXISTS idx_deals_bedrijf_id ON deals(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_projecten_status ON projecten(status);
CREATE INDEX IF NOT EXISTS idx_projecten_bedrijf_id ON projecten(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_offertes_status ON offertes(status);
CREATE INDEX IF NOT EXISTS idx_offertes_bedrijf_id ON offertes(bedrijf_id);

-- Row Level Security (RLS) - Enable on all tables
ALTER TABLE bedrijven ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacten ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecten ENABLE ROW LEVEL SECURITY;
ALTER TABLE offertes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Enable all operations for public" ON bedrijven;
CREATE POLICY "Allow authenticated select on bedrijven" ON bedrijven
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on bedrijven" ON bedrijven
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for public" ON contacten;
CREATE POLICY "Allow authenticated select on contacten" ON contacten
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on contacten" ON contacten
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for public" ON deals;
CREATE POLICY "Allow authenticated select on deals" ON deals
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on deals" ON deals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for public" ON projecten;
CREATE POLICY "Allow authenticated select on projecten" ON projecten
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on projecten" ON projecten
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for public" ON offertes;
CREATE POLICY "Allow authenticated select on offertes" ON offertes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on offertes" ON offertes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

