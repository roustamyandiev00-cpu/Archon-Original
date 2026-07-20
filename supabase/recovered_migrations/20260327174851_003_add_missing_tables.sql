-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327174851
-- Production name: 003_add_missing_tables
-- Add missing tables: inkomsten, uitgaven, artikelen, timesheets, betalingen, afspraken, abonnementen

-- Inkomsten table
CREATE TABLE IF NOT EXISTS inkomsten (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255),
  omschrijving TEXT,
  bedrag DECIMAL(12,2) NOT NULL DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  categorie VARCHAR(100),
  betaalmethode VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uitgaven table
CREATE TABLE IF NOT EXISTS uitgaven (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255),
  omschrijving TEXT,
  bedrag DECIMAL(12,2) NOT NULL DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  leverancier VARCHAR(255),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  categorie VARCHAR(100),
  betaalmethode VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artikelen table
CREATE TABLE IF NOT EXISTS artikelen (
  id BIGSERIAL PRIMARY KEY,
  naam VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  beschrijving TEXT,
  prijs DECIMAL(12,2) DEFAULT 0,
  voorraad INTEGER DEFAULT 0,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id BIGSERIAL PRIMARY KEY,
  gebruiker_id BIGINT,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES projecten(id) ON DELETE SET NULL,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  uren NUMERIC(5,2) NOT NULL DEFAULT 0,
  omschrijving TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betalingen table
CREATE TABLE IF NOT EXISTS betalingen (
  id BIGSERIAL PRIMARY KEY,
  referentie VARCHAR(255),
  bedrag DECIMAL(12,2) NOT NULL DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  betaalmethode VARCHAR(100),
  factuur_id BIGINT,
  offerte_id BIGINT REFERENCES offertes(id) ON DELETE SET NULL,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Afspraken / Agenda table
CREATE TABLE IF NOT EXISTS afspraken (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255) NOT NULL,
  beschrijving TEXT,
  start_tijd TIMESTAMP WITH TIME ZONE NOT NULL,
  eind_tijd TIMESTAMP WITH TIME ZONE,
  locatie VARCHAR(255),
  deelnemers JSONB,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abonnementen table
CREATE TABLE IF NOT EXISTS abonnementen (
  id BIGSERIAL PRIMARY KEY,
  gebruiker_id BIGINT,
  plan VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('actief','opgezegd','inactief')),
  start_datum DATE,
  eind_datum DATE,
  prijs DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for updated_at for new tables
DROP TRIGGER IF EXISTS update_inkomsten_updated_at ON inkomsten;
CREATE TRIGGER update_inkomsten_updated_at
  BEFORE UPDATE ON inkomsten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_uitgaven_updated_at ON uitgaven;
CREATE TRIGGER update_uitgaven_updated_at
  BEFORE UPDATE ON uitgaven
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artikelen_updated_at ON artikelen;
CREATE TRIGGER update_artikelen_updated_at
  BEFORE UPDATE ON artikelen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timesheets_updated_at ON timesheets;
CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_betalingen_updated_at ON betalingen;
CREATE TRIGGER update_betalingen_updated_at
  BEFORE UPDATE ON betalingen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_afspraken_updated_at ON afspraken;
CREATE TRIGGER update_afspraken_updated_at
  BEFORE UPDATE ON afspraken
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_abonnementen_updated_at ON abonnementen;
CREATE TRIGGER update_abonnementen_updated_at
  BEFORE UPDATE ON abonnementen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inkomsten_datum ON inkomsten(datum);
CREATE INDEX IF NOT EXISTS idx_uitgaven_datum ON uitgaven(datum);
CREATE INDEX IF NOT EXISTS idx_artikelen_naam ON artikelen(naam);
CREATE INDEX IF NOT EXISTS idx_timesheets_gebruiker ON timesheets(gebruiker_id);
CREATE INDEX IF NOT EXISTS idx_betalingen_datum ON betalingen(datum);
CREATE INDEX IF NOT EXISTS idx_afspraken_start ON afspraken(start_tijd);
CREATE INDEX IF NOT EXISTS idx_abonnementen_status ON abonnementen(status);

-- Enable RLS for new tables
ALTER TABLE inkomsten ENABLE ROW LEVEL SECURITY;
ALTER TABLE uitgaven ENABLE ROW LEVEL SECURITY;
ALTER TABLE artikelen ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE betalingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE afspraken ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnementen ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated select on inkomsten" ON inkomsten
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated select on uitgaven" ON uitgaven
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated select on artikelen" ON artikelen
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated select on timesheets" ON timesheets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated select on betalingen" ON betalingen
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated select on afspraken" ON afspraken
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated select on abonnementen" ON abonnementen
  FOR SELECT USING (auth.role() = 'authenticated');

