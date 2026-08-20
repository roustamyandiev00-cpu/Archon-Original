-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260501162030
-- Production name: fix_document_schema_full_rebuild

-- ============================================================
-- MIGRATION: fix_document_schema_full_rebuild
-- Drop and recreate all 4 document tables with correct schema.
-- All existing data is broken demo data (bedragen = 0).
-- ============================================================

-- Step 1: Drop dependent tables
DROP TABLE IF EXISTS offerte_activities CASCADE;
DROP TABLE IF EXISTS offerte_activity_log CASCADE;
DROP TABLE IF EXISTS factuur_lijnen CASCADE;
DROP TABLE IF EXISTS offerte_lijnen CASCADE;
DROP TABLE IF EXISTS facturen CASCADE;
DROP TABLE IF EXISTS offertes CASCADE;

-- Step 2: Drop stale sequences
DROP SEQUENCE IF EXISTS offertes_seq CASCADE;
DROP SEQUENCE IF EXISTS offerte_lijnen_seq CASCADE;
DROP SEQUENCE IF EXISTS facturen_seq CASCADE;
DROP SEQUENCE IF EXISTS factuur_lijnen_id_seq CASCADE;

-- ============================================================
-- Step 3: offertes
-- ============================================================
CREATE TABLE offertes (
  id            BIGSERIAL PRIMARY KEY,
  nummer        VARCHAR(50)   UNIQUE,
  klant         TEXT,
  bedrag        NUMERIC(12,2) NOT NULL DEFAULT 0,
  datum         DATE          NOT NULL DEFAULT CURRENT_DATE,
  geldig_tot    DATE,
  status        TEXT          NOT NULL DEFAULT 'Openstaand',
  status_new    TEXT          NOT NULL DEFAULT 'concept'
                  CHECK (status_new IN (
                    'concept','verzonden','bekeken','geaccepteerd',
                    'afgewezen','verlopen','gefactureerd','geconverteerd_naar_project'
                  )),
  bedrijf_id    BIGINT        REFERENCES bedrijven(id) ON DELETE SET NULL,
  customer_id   BIGINT,
  user_id       UUID,
  notes         TEXT,
  template_id   TEXT          NOT NULL DEFAULT 'professional',

  sent_at       TIMESTAMPTZ,
  viewed_at     TIMESTAMPTZ,
  accepted_at   TIMESTAMPTZ,
  rejected_at   TIMESTAMPTZ,
  expired_at    TIMESTAMPTZ,
  rejection_reason TEXT,

  versie_nummer INTEGER NOT NULL DEFAULT 1,
  public_token  TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,

  converted_to_invoice_id  BIGINT,
  converted_to_project_id  BIGINT,
  converted_at             TIMESTAMPTZ,
  converted_to_type        TEXT CHECK (converted_to_type IN ('invoice','project')),
  converted_by             UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Step 4: offerte_lijnen
-- ============================================================
CREATE TABLE offerte_lijnen (
  id                BIGSERIAL PRIMARY KEY,
  offerte_id        BIGINT        NOT NULL REFERENCES offertes(id) ON DELETE CASCADE,
  company_id        BIGINT        NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  omschrijving      TEXT,
  aantal            NUMERIC(10,2) NOT NULL DEFAULT 1,
  eenheid           TEXT          NOT NULL DEFAULT 'stuks',
  prijs_per_eenheid NUMERIC(10,2) NOT NULL DEFAULT 0,
  btw_percentage    NUMERIC(5,2)  NOT NULL DEFAULT 21,
  sort_order        INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Step 5: facturen
-- ============================================================
CREATE TABLE facturen (
  id              BIGSERIAL PRIMARY KEY,
  nummer          VARCHAR(50)   UNIQUE,
  klant           TEXT,
  bedrag          NUMERIC(12,2) NOT NULL DEFAULT 0,
  btw_bedrag      NUMERIC(12,2) NOT NULL DEFAULT 0,
  totaal_bedrag   NUMERIC(12,2) NOT NULL DEFAULT 0,
  datum           DATE          NOT NULL DEFAULT CURRENT_DATE,
  vervaldatum     DATE,
  status          TEXT          NOT NULL DEFAULT 'concept',
  document_type   TEXT          NOT NULL DEFAULT 'factuur'
                    CHECK (document_type IN ('factuur','credit_nota','proforma')),
  credit_nota_voor BIGINT,
  bedrijf_id      BIGINT        REFERENCES bedrijven(id) ON DELETE SET NULL,
  customer_id     BIGINT,
  user_id         UUID,
  offerte_id      BIGINT        REFERENCES offertes(id) ON DELETE SET NULL,
  omschrijving    TEXT,
  notities        TEXT,
  template_id     TEXT          NOT NULL DEFAULT 'professional',

  sent_at              TIMESTAMPTZ,
  paid_at              TIMESTAMPTZ,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count       INTEGER NOT NULL DEFAULT 0,
  versie_nummer        INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Step 6: factuur_lijnen
-- ============================================================
CREATE TABLE factuur_lijnen (
  id                BIGSERIAL PRIMARY KEY,
  factuur_id        BIGINT        NOT NULL REFERENCES facturen(id) ON DELETE CASCADE,
  company_id        BIGINT        REFERENCES bedrijven(id) ON DELETE CASCADE,
  omschrijving      TEXT,
  aantal            NUMERIC(10,2) NOT NULL DEFAULT 1,
  eenheid           TEXT          NOT NULL DEFAULT 'stuks',
  prijs_per_eenheid NUMERIC(10,2) NOT NULL DEFAULT 0,
  btw_percentage    NUMERIC(5,2)  NOT NULL DEFAULT 21,
  sort_order        INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Step 7: bedrijven — add missing columns
-- ============================================================
ALTER TABLE bedrijven
  ADD COLUMN IF NOT EXISTS iban                TEXT,
  ADD COLUMN IF NOT EXISTS logo_url            TEXT,
  ADD COLUMN IF NOT EXISTS betaalterm          INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS footer_tekst        TEXT,
  ADD COLUMN IF NOT EXISTS algemene_voorwaarden TEXT;

-- ============================================================
-- Step 8: Indexes
-- ============================================================
CREATE INDEX idx_offertes_bedrijf_id   ON offertes(bedrijf_id);
CREATE INDEX idx_offertes_customer_id  ON offertes(customer_id);
CREATE INDEX idx_offertes_status_new   ON offertes(status_new);
CREATE INDEX idx_offertes_nummer       ON offertes(nummer);

CREATE INDEX idx_offerte_lijnen_offerte_id ON offerte_lijnen(offerte_id);
CREATE INDEX idx_offerte_lijnen_company_id ON offerte_lijnen(company_id);

CREATE INDEX idx_facturen_bedrijf_id  ON facturen(bedrijf_id);
CREATE INDEX idx_facturen_customer_id ON facturen(customer_id);
CREATE INDEX idx_facturen_status      ON facturen(status);
CREATE INDEX idx_facturen_nummer      ON facturen(nummer);

CREATE INDEX idx_factuur_lijnen_factuur_id ON factuur_lijnen(factuur_id);
CREATE INDEX idx_factuur_lijnen_company_id ON factuur_lijnen(company_id);

-- ============================================================
-- Step 9: RLS (company_memberships.company_id is the correct column)
-- ============================================================
ALTER TABLE offertes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerte_lijnen ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturen       ENABLE ROW LEVEL SECURITY;
ALTER TABLE factuur_lijnen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offertes_company_access" ON offertes
  FOR ALL TO authenticated
  USING (
    bedrijf_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bedrijf_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "offerte_lijnen_company_access" ON offerte_lijnen
  FOR ALL TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "facturen_company_access" ON facturen
  FOR ALL TO authenticated
  USING (
    bedrijf_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bedrijf_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "factuur_lijnen_company_access" ON factuur_lijnen
  FOR ALL TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Step 10: updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_offertes_updated_at
  BEFORE UPDATE ON offertes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_facturen_updated_at
  BEFORE UPDATE ON facturen
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_factuur_lijnen_updated_at
  BEFORE UPDATE ON factuur_lijnen
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

