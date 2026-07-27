-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260403200000
-- Production name: factuur_email_instellingen
-- Factuur email instellingen per bedrijf
-- Beheert automatische herinneringen en betaallinks in emails

CREATE TABLE IF NOT EXISTS public.factuur_email_instellingen (
  id                          BIGSERIAL PRIMARY KEY,
  bedrijf_id                  BIGINT NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,

  -- Automatische herinnering na vervaldatum
  herinnering_actief          BOOLEAN NOT NULL DEFAULT false,
  herinnering_dagen_na        INTEGER NOT NULL DEFAULT 3,   -- X dagen na vervaldatum
  herinnering_herhaal_dagen   INTEGER NOT NULL DEFAULT 7,   -- daarna elke X dagen
  herinnering_max_aantal      INTEGER NOT NULL DEFAULT 3,   -- max aantal herinneringen

  -- Betaallink in email
  betaallink_in_email         BOOLEAN NOT NULL DEFAULT true,

  -- Tijdstempel
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (bedrijf_id)
);

-- Recovered statement 2
-- RLS
ALTER TABLE public.factuur_email_instellingen ENABLE ROW LEVEL SECURITY;

-- Recovered statement 3
CREATE POLICY "Bedrijf leden kunnen eigen instellingen lezen"
  ON public.factuur_email_instellingen FOR SELECT
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 4
CREATE POLICY "Admins kunnen instellingen beheren"
  ON public.factuur_email_instellingen FOR ALL
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Recovered statement 5
-- Kolom op facturen voor herinnering tracking
ALTER TABLE public.facturen
  ADD COLUMN IF NOT EXISTS herinnering_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS laatste_herinnering TIMESTAMPTZ;

