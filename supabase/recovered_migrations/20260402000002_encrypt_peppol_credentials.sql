-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260402000002
-- Production name: encrypt_peppol_credentials
-- ============================================================
-- E-invoicing settings + encrypted PEPPOL credentials
-- ============================================================
-- Maakt company_einvoicing_settings aan als die nog niet bestaat,
-- en voegt encrypted credential kolommen toe.
--
-- Encryptie: pgcrypto AES-256 (pgp_sym_encrypt)
-- Key: PEPPOL_ENCRYPTION_KEY env var (nooit in DB opgeslagen)
-- ============================================================

-- 1. pgcrypto (al aanwezig in Supabase, maar zeker stellen)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recovered statement 2
-- 2. Maak de tabel aan als die nog niet bestaat
CREATE TABLE IF NOT EXISTS public.company_einvoicing_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedrijf_id                  BIGINT UNIQUE REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  is_enabled                  BOOLEAN NOT NULL DEFAULT false,
  provider_id                 TEXT NOT NULL DEFAULT 'PEPPOL_ACCESS_POINT',
  environment                 TEXT NOT NULL DEFAULT 'sandbox'
                                CHECK (environment IN ('sandbox', 'production')),
  auto_send                   BOOLEAN NOT NULL DEFAULT false,
  encrypted_credentials       JSONB,                    -- legacy, wordt geleegd na migratie
  peppol_api_key_encrypted    TEXT,                     -- AES-256 encrypted, base64
  peppol_endpoint_url         TEXT,                     -- plaintext, niet gevoelig
  peppol_credentials_version  INTEGER DEFAULT 1,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Recovered statement 3
-- 3. Voeg kolommen toe als de tabel al bestond zonder die kolommen
ALTER TABLE public.company_einvoicing_settings
  ADD COLUMN IF NOT EXISTS peppol_api_key_encrypted   TEXT,
  ADD COLUMN IF NOT EXISTS peppol_endpoint_url         TEXT,
  ADD COLUMN IF NOT EXISTS peppol_credentials_version  INTEGER DEFAULT 1;

-- Recovered statement 4
-- 4. RLS
ALTER TABLE public.company_einvoicing_settings ENABLE ROW LEVEL SECURITY;

-- Recovered statement 5
-- Leden van het bedrijf mogen instellingen lezen (zonder credentials)
DROP POLICY IF EXISTS "einvoicing_settings: read own company" ON public.company_einvoicing_settings;

-- Recovered statement 6
CREATE POLICY "einvoicing_settings: read own company"
  ON public.company_einvoicing_settings FOR SELECT
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 7
-- Alleen admins mogen instellingen aanpassen
DROP POLICY IF EXISTS "einvoicing_settings: admin update" ON public.company_einvoicing_settings;

-- Recovered statement 8
CREATE POLICY "einvoicing_settings: admin update"
  ON public.company_einvoicing_settings FOR ALL
  USING (
    bedrijf_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Recovered statement 9
-- 5. Index
CREATE INDEX IF NOT EXISTS idx_einvoicing_settings_bedrijf
  ON public.company_einvoicing_settings(bedrijf_id);

-- Recovered statement 10
-- 6. Veilige view — credentials worden nooit getoond aan de client
CREATE OR REPLACE VIEW public.company_einvoicing_settings_safe AS
SELECT
  id,
  bedrijf_id,
  is_enabled,
  provider_id,
  environment,
  auto_send,
  peppol_endpoint_url,
  peppol_credentials_version,
  peppol_api_key_encrypted IS NOT NULL AS has_peppol_credentials,
  created_at,
  updated_at
FROM public.company_einvoicing_settings;

-- Recovered statement 11
-- 7. updated_at trigger
CREATE OR REPLACE TRIGGER update_einvoicing_settings_updated_at
  BEFORE UPDATE ON public.company_einvoicing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 12
-- 8. Commentaar
COMMENT ON TABLE  public.company_einvoicing_settings IS
  'E-invoicing configuratie per bedrijf. Credentials worden encrypted opgeslagen.';

-- Recovered statement 13
COMMENT ON COLUMN public.company_einvoicing_settings.peppol_api_key_encrypted IS
  'PEPPOL API key, AES-256 encrypted via pgcrypto. Key staat in PEPPOL_ENCRYPTION_KEY env var.';

-- Recovered statement 14
COMMENT ON COLUMN public.company_einvoicing_settings.encrypted_credentials IS
  'Legacy JSONB kolom. Wordt geleegd na migratie naar peppol_api_key_encrypted.';

