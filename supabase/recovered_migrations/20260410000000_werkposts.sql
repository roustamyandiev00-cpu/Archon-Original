-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410000000
-- Production name: werkposts
-- Werkposts tabel voor partnernetwerk
-- Bedrijven kunnen hier werk aanbieden of zoeken

CREATE TYPE werkpost_type AS ENUM ('aanbod', 'vraag');

-- Recovered statement 2
CREATE TYPE werkpost_urgentie AS ENUM ('normaal', 'urgent', 'zeer_urgent');

-- Recovered statement 3
CREATE TYPE werkpost_status AS ENUM ('open', 'in_behandeling', 'gesloten', 'verlopen');

-- Recovered statement 4
CREATE TABLE werkposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Eigenaar
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Type
  type werkpost_type NOT NULL DEFAULT 'aanbod',
  
  -- Basis informatie
  titel VARCHAR(200) NOT NULL,
  beschrijving TEXT NOT NULL,
  aard_van_werk VARCHAR(100) NOT NULL, -- bijv. "Metselwerk", "Elektriciteit", etc.
  
  -- Locatie
  regio VARCHAR(100) NOT NULL,
  adres TEXT,
  postcode VARCHAR(10),
  stad VARCHAR(100),
  
  -- Capaciteit
  aantal_personen INTEGER NOT NULL DEFAULT 1,
  vereiste_vaardigheden TEXT[], -- Array van vaardigheden
  
  -- Planning
  startdatum DATE NOT NULL,
  einddatum DATE,
  geschatte_duur_dagen INTEGER,
  
  -- Financieel
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  tarief_per_uur DECIMAL(10,2),
  tarief_type VARCHAR(50), -- 'per_uur', 'per_dag', 'vast_bedrag'
  
  -- Media
  fotos TEXT[], -- Array van URLs
  documenten TEXT[], -- Array van document URLs
  
  -- Status & Urgentie
  status werkpost_status NOT NULL DEFAULT 'open',
  urgentie werkpost_urgentie NOT NULL DEFAULT 'normaal',
  
  -- Reacties & Views
  aantal_reacties INTEGER DEFAULT 0,
  aantal_views INTEGER DEFAULT 0,
  
  -- Metadata
  is_actief BOOLEAN DEFAULT true,
  verloopt_op TIMESTAMP WITH TIME ZONE,
  gesloten_op TIMESTAMP WITH TIME ZONE,
  gesloten_reden TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 5
-- Reacties op werkposts
CREATE TABLE werkpost_reacties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  werkpost_id UUID NOT NULL REFERENCES werkposts(id) ON DELETE CASCADE,
  
  -- Reageerder
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Inhoud
  bericht TEXT NOT NULL,
  beschikbaarheid_vanaf DATE,
  beschikbaarheid_tot DATE,
  voorgesteld_tarief DECIMAL(10,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 6
-- Views tracking
CREATE TABLE werkpost_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  werkpost_id UUID NOT NULL REFERENCES werkposts(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 7
-- Indexes
CREATE INDEX idx_werkposts_company ON werkposts(company_id);

-- Recovered statement 8
CREATE INDEX idx_werkposts_status ON werkposts(status);

-- Recovered statement 9
CREATE INDEX idx_werkposts_regio ON werkposts(regio);

-- Recovered statement 10
CREATE INDEX idx_werkposts_startdatum ON werkposts(startdatum);

-- Recovered statement 11
CREATE INDEX idx_werkposts_type ON werkposts(type);

-- Recovered statement 12
CREATE INDEX idx_werkposts_urgentie ON werkposts(urgentie);

-- Recovered statement 13
CREATE INDEX idx_werkposts_created_at ON werkposts(created_at DESC);

-- Recovered statement 14
CREATE INDEX idx_werkpost_reacties_werkpost ON werkpost_reacties(werkpost_id);

-- Recovered statement 15
CREATE INDEX idx_werkpost_reacties_company ON werkpost_reacties(company_id);

-- Recovered statement 16
CREATE INDEX idx_werkpost_views_werkpost ON werkpost_views(werkpost_id);

-- Recovered statement 17
CREATE INDEX idx_werkpost_views_company ON werkpost_views(company_id);

-- Recovered statement 18
-- RLS Policies
ALTER TABLE werkposts ENABLE ROW LEVEL SECURITY;

-- Recovered statement 19
ALTER TABLE werkpost_reacties ENABLE ROW LEVEL SECURITY;

-- Recovered statement 20
ALTER TABLE werkpost_views ENABLE ROW LEVEL SECURITY;

-- Recovered statement 21
-- Werkposts: Iedereen kan lezen, alleen eigenaar kan wijzigen
CREATE POLICY "Werkposts zijn zichtbaar voor alle bedrijven"
  ON werkposts FOR SELECT
  USING (is_actief = true);

-- Recovered statement 22
CREATE POLICY "Bedrijven kunnen eigen werkposts aanmaken"
  ON werkposts FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 23
CREATE POLICY "Bedrijven kunnen eigen werkposts wijzigen"
  ON werkposts FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 24
CREATE POLICY "Bedrijven kunnen eigen werkposts verwijderen"
  ON werkposts FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 25
-- Reacties: Iedereen kan lezen, alleen eigenaar kan wijzigen
CREATE POLICY "Reacties zijn zichtbaar voor werkpost eigenaar en reageerder"
  ON werkpost_reacties FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
    OR werkpost_id IN (SELECT id FROM werkposts WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    ))
  );

-- Recovered statement 26
CREATE POLICY "Bedrijven kunnen reageren op werkposts"
  ON werkpost_reacties FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 27
CREATE POLICY "Bedrijven kunnen eigen reacties wijzigen"
  ON werkpost_reacties FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 28
-- Views: Iedereen kan views toevoegen
CREATE POLICY "Bedrijven kunnen werkposts bekijken"
  ON werkpost_views FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 29
-- Triggers voor updated_at
CREATE TRIGGER update_werkposts_updated_at
  BEFORE UPDATE ON werkposts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 30
CREATE TRIGGER update_werkpost_reacties_updated_at
  BEFORE UPDATE ON werkpost_reacties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 31
-- Trigger voor aantal_reacties
CREATE OR REPLACE FUNCTION update_werkpost_reacties_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE werkposts 
    SET aantal_reacties = aantal_reacties + 1 
    WHERE id = NEW.werkpost_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE werkposts 
    SET aantal_reacties = aantal_reacties - 1 
    WHERE id = OLD.werkpost_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 32
CREATE TRIGGER werkpost_reacties_count_trigger
  AFTER INSERT OR DELETE ON werkpost_reacties
  FOR EACH ROW
  EXECUTE FUNCTION update_werkpost_reacties_count();

-- Recovered statement 33
-- Trigger voor aantal_views
CREATE OR REPLACE FUNCTION update_werkpost_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE werkposts 
  SET aantal_views = aantal_views + 1 
  WHERE id = NEW.werkpost_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 34
CREATE TRIGGER werkpost_views_count_trigger
  AFTER INSERT ON werkpost_views
  FOR EACH ROW
  EXECUTE FUNCTION update_werkpost_views_count();

-- Recovered statement 35
-- Functie om verlopen werkposts te markeren
CREATE OR REPLACE FUNCTION mark_expired_werkposts()
RETURNS void AS $$
BEGIN
  UPDATE werkposts
  SET status = 'verlopen'
  WHERE status = 'open'
    AND verloopt_op IS NOT NULL
    AND verloopt_op < NOW();
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 36
COMMENT ON TABLE werkposts IS 'Werkposts voor partnernetwerk - bedrijven kunnen werk aanbieden of zoeken';

-- Recovered statement 37
COMMENT ON TABLE werkpost_reacties IS 'Reacties op werkposts';

-- Recovered statement 38
COMMENT ON TABLE werkpost_views IS 'Tracking van werkpost views';

