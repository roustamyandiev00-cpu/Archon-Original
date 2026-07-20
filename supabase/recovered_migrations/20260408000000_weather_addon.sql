-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260408000000
-- Production name: weather_addon
-- Weather Add-on Feature
-- Voegt weerfunctionaliteit toe als premium add-on voor abonnementen

-- Add-ons tabel voor extra features
CREATE TABLE IF NOT EXISTS public.company_addons (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  addon_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'pending')),
  price_per_month NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, addon_type)
);

-- Recovered statement 2
-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_company_addons_company_id ON public.company_addons(company_id);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_company_addons_status ON public.company_addons(status);

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS idx_company_addons_type ON public.company_addons(addon_type);

-- Recovered statement 5
-- Add-on prijzen en configuratie
CREATE TABLE IF NOT EXISTS public.addon_catalog (
  addon_type VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_per_month NUMERIC(10,2) NOT NULL,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recovered statement 6
-- Voeg weather add-on toe aan catalog
INSERT INTO public.addon_catalog (addon_type, name, description, price_per_month, features) VALUES
  ('weather', 'Weer & Planning', 'Real-time weersvoorspellingen en automatische planning aanpassingen voor bouwprojecten', 9.99, 
   '{"features": ["Real-time weersvoorspellingen", "7-dagen voorspelling", "Automatische weeralerts", "Impact op planning", "Project-specifieke alerts", "AI-gestuurde aanbevelingen"]}'::jsonb)
ON CONFLICT (addon_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_per_month = EXCLUDED.price_per_month,
  features = EXCLUDED.features;

-- Recovered statement 7
-- Functie om te checken of een bedrijf een add-on heeft
CREATE OR REPLACE FUNCTION public.has_addon(p_company_id BIGINT, p_addon_type VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_addon BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.company_addons 
    WHERE company_id = p_company_id 
      AND addon_type = p_addon_type 
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW())
  ) INTO v_has_addon;
  
  RETURN v_has_addon;
END;
$$;

-- Recovered statement 8
-- Functie om add-on te activeren
CREATE OR REPLACE FUNCTION public.activate_addon(
  p_company_id BIGINT, 
  p_addon_type VARCHAR,
  p_auto_renew BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price NUMERIC(10,2);
  v_addon_id BIGINT;
BEGIN
  -- Haal prijs op uit catalog
  SELECT price_per_month INTO v_price
  FROM public.addon_catalog
  WHERE addon_type = p_addon_type AND is_active = true;
  
  IF v_price IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Add-on niet gevonden of niet actief'
    );
  END IF;
  
  -- Activeer of update add-on
  INSERT INTO public.company_addons (
    company_id, 
    addon_type, 
    status, 
    price_per_month, 
    auto_renew
  ) VALUES (
    p_company_id,
    p_addon_type,
    'active',
    v_price,
    p_auto_renew
  )
  ON CONFLICT (company_id, addon_type) 
  DO UPDATE SET
    status = 'active',
    price_per_month = v_price,
    auto_renew = p_auto_renew,
    start_date = NOW(),
    end_date = NULL,
    updated_at = NOW()
  RETURNING id INTO v_addon_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'addon_id', v_addon_id,
    'price_per_month', v_price
  );
END;
$$;

-- Recovered statement 9
-- Functie om add-on te deactiveren
CREATE OR REPLACE FUNCTION public.deactivate_addon(
  p_company_id BIGINT, 
  p_addon_type VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.company_addons
  SET 
    status = 'cancelled',
    end_date = NOW(),
    updated_at = NOW()
  WHERE company_id = p_company_id 
    AND addon_type = p_addon_type
    AND status = 'active';
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Add-on niet gevonden of al gedeactiveerd'
    );
  END IF;
END;
$$;

-- Recovered statement 10
-- Functie om alle actieve add-ons van een bedrijf op te halen
CREATE OR REPLACE FUNCTION public.get_company_addons(p_company_id BIGINT)
RETURNS TABLE(
  addon_type VARCHAR,
  name VARCHAR,
  description TEXT,
  price_per_month NUMERIC,
  status VARCHAR,
  start_date TIMESTAMPTZ,
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.addon_type,
    ac.name,
    ac.description,
    ca.price_per_month,
    ca.status,
    ca.start_date,
    ac.features
  FROM public.company_addons ca
  JOIN public.addon_catalog ac ON ca.addon_type = ac.addon_type
  WHERE ca.company_id = p_company_id
    AND ca.status = 'active'
    AND (ca.end_date IS NULL OR ca.end_date > NOW())
  ORDER BY ca.created_at DESC;
END;
$$;

-- Recovered statement 11
-- Trigger voor updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 12
DROP TRIGGER IF EXISTS update_company_addons_updated_at ON public.company_addons;

-- Recovered statement 13
CREATE TRIGGER update_company_addons_updated_at
  BEFORE UPDATE ON public.company_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 14
DROP TRIGGER IF EXISTS update_addon_catalog_updated_at ON public.addon_catalog;

-- Recovered statement 15
CREATE TRIGGER update_addon_catalog_updated_at
  BEFORE UPDATE ON public.addon_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 16
-- RLS Policies
ALTER TABLE public.company_addons ENABLE ROW LEVEL SECURITY;

-- Recovered statement 17
ALTER TABLE public.addon_catalog ENABLE ROW LEVEL SECURITY;

-- Recovered statement 18
-- Gebruikers kunnen hun eigen add-ons zien
DROP POLICY IF EXISTS "Users can view their company addons" ON public.company_addons;

-- Recovered statement 19
CREATE POLICY "Users can view their company addons" ON public.company_addons
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 20
-- Iedereen kan de add-on catalog zien
DROP POLICY IF EXISTS "Anyone can view addon catalog" ON public.addon_catalog;

-- Recovered statement 21
CREATE POLICY "Anyone can view addon catalog" ON public.addon_catalog
  FOR SELECT
  USING (is_active = true);

-- Recovered statement 22
-- Alleen service role kan add-ons activeren/deactiveren (via API)
DROP POLICY IF EXISTS "Service role can manage addons" ON public.company_addons;

-- Recovered statement 23
CREATE POLICY "Service role can manage addons" ON public.company_addons
  FOR ALL
  USING (auth.role() = 'service_role');

-- Recovered statement 24
-- Comments voor documentatie
COMMENT ON TABLE public.company_addons IS 'Premium add-ons voor bedrijven (zoals weer, AI features, etc.)';

-- Recovered statement 25
COMMENT ON TABLE public.addon_catalog IS 'Catalogus van beschikbare add-ons met prijzen en features';

-- Recovered statement 26
COMMENT ON FUNCTION public.has_addon IS 'Check of een bedrijf een specifieke add-on heeft';

-- Recovered statement 27
COMMENT ON FUNCTION public.activate_addon IS 'Activeer een add-on voor een bedrijf';

-- Recovered statement 28
COMMENT ON FUNCTION public.deactivate_addon IS 'Deactiveer een add-on voor een bedrijf';

-- Recovered statement 29
COMMENT ON FUNCTION public.get_company_addons IS 'Haal alle actieve add-ons van een bedrijf op';

