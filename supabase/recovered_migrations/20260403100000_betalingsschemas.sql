-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260403100000
-- Production name: betalingsschemas
-- ============================================================
-- BETALINGSSCHEMA'S (betaling in schijven)
-- Flexibel systeem: standaard 50/40/10 maar volledig aanpasbaar
-- ============================================================

-- Hoofd tabel: een schema is gekoppeld aan een factuur of offerte
CREATE TABLE IF NOT EXISTS public.betalingsschemas (
  id            BIGSERIAL PRIMARY KEY,
  bedrijf_id    BIGINT NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  factuur_id    BIGINT REFERENCES public.facturen(id) ON DELETE CASCADE,
  offerte_id    BIGINT REFERENCES public.offertes(id) ON DELETE CASCADE,
  naam          TEXT NOT NULL DEFAULT 'Betalingsschema',
  totaal_bedrag NUMERIC(12,2) NOT NULL DEFAULT 0,
  notities      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schema_link CHECK (
    (factuur_id IS NOT NULL AND offerte_id IS NULL) OR
    (factuur_id IS NULL AND offerte_id IS NOT NULL) OR
    (factuur_id IS NULL AND offerte_id IS NULL)
  )
);

-- Recovered statement 2
-- Schijven: elke rij is één betalingsschijf
CREATE TABLE IF NOT EXISTS public.betalingsschijven (
  id                BIGSERIAL PRIMARY KEY,
  schema_id         BIGINT NOT NULL REFERENCES public.betalingsschemas(id) ON DELETE CASCADE,
  bedrijf_id        BIGINT NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  volgorde          INTEGER NOT NULL DEFAULT 1,
  label             TEXT NOT NULL,           -- bv. "Voorschot", "Bij levering", "Einde werken"
  percentage        NUMERIC(5,2),            -- bv. 50.00 (optioneel, anders vast bedrag)
  vast_bedrag       NUMERIC(12,2),           -- vast bedrag (alternatief voor percentage)
  berekend_bedrag   NUMERIC(12,2),           -- berekend op basis van % of vast bedrag
  vervaldatum       DATE,
  status            TEXT NOT NULL DEFAULT 'gepland',
  factuur_id        BIGINT REFERENCES public.facturen(id) ON DELETE SET NULL,
  betaling_id       BIGINT REFERENCES public.betalingen(id) ON DELETE SET NULL,
  betaald_op        DATE,
  notities          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schijf_status CHECK (status IN (
    'gepland', 'gefactureerd', 'betaald', 'achterstallig', 'geannuleerd'
  )),
  CONSTRAINT chk_schijf_bedrag CHECK (
    percentage IS NOT NULL OR vast_bedrag IS NOT NULL
  )
);

-- Recovered statement 3
-- Voorgedefinieerde sjablonen
CREATE TABLE IF NOT EXISTS public.betalingsschema_sjablonen (
  id          BIGSERIAL PRIMARY KEY,
  bedrijf_id  BIGINT REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  naam        TEXT NOT NULL,
  is_standaard BOOLEAN NOT NULL DEFAULT false,
  schijven    JSONB NOT NULL DEFAULT '[]',  -- array van {label, percentage, vast_bedrag, volgorde}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recovered statement 4
-- Indexes
CREATE INDEX IF NOT EXISTS idx_betalingsschemas_bedrijf ON public.betalingsschemas(bedrijf_id);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS idx_betalingsschemas_factuur ON public.betalingsschemas(factuur_id);

-- Recovered statement 6
CREATE INDEX IF NOT EXISTS idx_betalingsschemas_offerte ON public.betalingsschemas(offerte_id);

-- Recovered statement 7
CREATE INDEX IF NOT EXISTS idx_betalingsschijven_schema ON public.betalingsschijven(schema_id);

-- Recovered statement 8
CREATE INDEX IF NOT EXISTS idx_betalingsschijven_status ON public.betalingsschijven(status);

-- Recovered statement 9
CREATE INDEX IF NOT EXISTS idx_betalingsschijven_factuur ON public.betalingsschijven(factuur_id);

-- Recovered statement 10
CREATE INDEX IF NOT EXISTS idx_sjablonen_bedrijf ON public.betalingsschema_sjablonen(bedrijf_id);

-- Recovered statement 11
-- Updated_at triggers
CREATE TRIGGER set_betalingsschemas_updated_at
  BEFORE UPDATE ON public.betalingsschemas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recovered statement 12
CREATE TRIGGER set_betalingsschijven_updated_at
  BEFORE UPDATE ON public.betalingsschijven
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recovered statement 13
-- RLS
ALTER TABLE public.betalingsschemas ENABLE ROW LEVEL SECURITY;

-- Recovered statement 14
ALTER TABLE public.betalingsschijven ENABLE ROW LEVEL SECURITY;

-- Recovered statement 15
ALTER TABLE public.betalingsschema_sjablonen ENABLE ROW LEVEL SECURITY;

-- Recovered statement 16
-- Policies: toegang via company membership
CREATE POLICY "betalingsschemas_select" ON public.betalingsschemas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschemas.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 17
CREATE POLICY "betalingsschemas_insert" ON public.betalingsschemas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschemas.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 18
CREATE POLICY "betalingsschemas_update" ON public.betalingsschemas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschemas.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 19
CREATE POLICY "betalingsschemas_delete" ON public.betalingsschemas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschemas.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 20
CREATE POLICY "betalingsschijven_select" ON public.betalingsschijven
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschijven.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 21
CREATE POLICY "betalingsschijven_insert" ON public.betalingsschijven
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschijven.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 22
CREATE POLICY "betalingsschijven_update" ON public.betalingsschijven
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschijven.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 23
CREATE POLICY "betalingsschijven_delete" ON public.betalingsschijven
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschijven.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 24
CREATE POLICY "sjablonen_select" ON public.betalingsschema_sjablonen
  FOR SELECT USING (
    bedrijf_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschema_sjablonen.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 25
CREATE POLICY "sjablonen_insert" ON public.betalingsschema_sjablonen
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschema_sjablonen.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 26
CREATE POLICY "sjablonen_update" ON public.betalingsschema_sjablonen
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschema_sjablonen.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 27
CREATE POLICY "sjablonen_delete" ON public.betalingsschema_sjablonen
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.company_id = betalingsschema_sjablonen.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 28
-- Standaard sjablonen (globaal, geen bedrijf_id)
INSERT INTO public.betalingsschema_sjablonen (naam, is_standaard, schijven) VALUES
(
  '50/40/10 - Bouw standaard',
  true,
  '[
    {"volgorde": 1, "label": "Voorschot",      "percentage": 50},
    {"volgorde": 2, "label": "Bij levering",   "percentage": 40},
    {"volgorde": 3, "label": "Einde werken",   "percentage": 10}
  ]'::jsonb
),
(
  '30/30/30/10 - Grote projecten',
  false,
  '[
    {"volgorde": 1, "label": "Voorschot",        "percentage": 30},
    {"volgorde": 2, "label": "Fase 1 voltooid",  "percentage": 30},
    {"volgorde": 3, "label": "Fase 2 voltooid",  "percentage": 30},
    {"volgorde": 4, "label": "Oplevering",       "percentage": 10}
  ]'::jsonb
),
(
  '50/50 - Eenvoudig',
  false,
  '[
    {"volgorde": 1, "label": "Voorschot",    "percentage": 50},
    {"volgorde": 2, "label": "Na oplevering","percentage": 50}
  ]'::jsonb
),
(
  '100% vooraf',
  false,
  '[
    {"volgorde": 1, "label": "Volledige betaling", "percentage": 100}
  ]'::jsonb
);

