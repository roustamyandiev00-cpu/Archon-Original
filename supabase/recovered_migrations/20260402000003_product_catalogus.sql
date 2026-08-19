-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260402000003
-- Production name: product_catalogus
-- ============================================================
-- Product & Diensten Catalogus
-- ============================================================
-- Vervangt de basis artikelen tabel met een volwaardige
-- catalogus die gebruikt wordt in offertes en facturen.
-- ============================================================

-- 1. Upgrade de artikelen tabel
ALTER TABLE public.artikelen
  ADD COLUMN IF NOT EXISTS eenheid         TEXT DEFAULT 'stuk',
  ADD COLUMN IF NOT EXISTS btw_tarief      NUMERIC(5,2) DEFAULT 21.00,
  ADD COLUMN IF NOT EXISTS categorie       TEXT DEFAULT 'algemeen',
  ADD COLUMN IF NOT EXISTS is_actief       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS inkoopprijs     NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS user_id         TEXT;

-- Recovered statement 2
-- 2. RLS aanzetten
ALTER TABLE public.artikelen ENABLE ROW LEVEL SECURITY;

-- Recovered statement 3
-- 3. RLS policies
DROP POLICY IF EXISTS "artikelen: read own company" ON public.artikelen;

-- Recovered statement 4
CREATE POLICY "artikelen: read own company"
  ON public.artikelen FOR SELECT
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 5
DROP POLICY IF EXISTS "artikelen: insert own company" ON public.artikelen;

-- Recovered statement 6
CREATE POLICY "artikelen: insert own company"
  ON public.artikelen FOR INSERT
  WITH CHECK (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 7
DROP POLICY IF EXISTS "artikelen: update own company" ON public.artikelen;

-- Recovered statement 8
CREATE POLICY "artikelen: update own company"
  ON public.artikelen FOR UPDATE
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 9
DROP POLICY IF EXISTS "artikelen: delete own company" ON public.artikelen;

-- Recovered statement 10
CREATE POLICY "artikelen: delete own company"
  ON public.artikelen FOR DELETE
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 11
-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_artikelen_bedrijf_id  ON public.artikelen(bedrijf_id);

-- Recovered statement 12
CREATE INDEX IF NOT EXISTS idx_artikelen_is_actief   ON public.artikelen(bedrijf_id, is_actief);

-- Recovered statement 13
CREATE INDEX IF NOT EXISTS idx_artikelen_categorie   ON public.artikelen(bedrijf_id, categorie);

-- Recovered statement 14
CREATE INDEX IF NOT EXISTS idx_artikelen_naam        ON public.artikelen USING gin(to_tsvector('dutch', naam));

-- Recovered statement 15
-- 5. Updated_at trigger
CREATE OR REPLACE TRIGGER update_artikelen_updated_at
  BEFORE UPDATE ON public.artikelen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 16
-- 6. Commentaar
COMMENT ON TABLE  public.artikelen IS 'Product & diensten catalogus per bedrijf. Gebruikt in offertes en facturen.';

-- Recovered statement 17
COMMENT ON COLUMN public.artikelen.eenheid     IS 'Eenheid: stuk, uur, m², m, kg, dag, ...';

-- Recovered statement 18
COMMENT ON COLUMN public.artikelen.btw_tarief  IS 'BTW tarief in procent: 21, 12, 6 of 0';

-- Recovered statement 19
COMMENT ON COLUMN public.artikelen.categorie   IS 'Vrije categorisering: materiaal, arbeid, transport, ...';

-- Recovered statement 20
COMMENT ON COLUMN public.artikelen.inkoopprijs IS 'Inkoopprijs voor marge berekening (optioneel)';

