-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260501154208
-- Production name: document_templates
-- Voegt template_id toe aan offertes en facturen
-- Voegt standaard template-instellingen toe aan bedrijven

-- 1. Voeg template-defaults toe aan bedrijven
ALTER TABLE bedrijven
  ADD COLUMN IF NOT EXISTS default_quote_template TEXT NOT NULL DEFAULT 'professional'
    CHECK (default_quote_template IN ('professional', 'premium', 'compact')),
  ADD COLUMN IF NOT EXISTS default_invoice_template TEXT NOT NULL DEFAULT 'professional'
    CHECK (default_invoice_template IN ('professional', 'premium', 'compact')),
  ADD COLUMN IF NOT EXISTS default_advance_template TEXT NOT NULL DEFAULT 'compact'
    CHECK (default_advance_template IN ('professional', 'premium', 'compact'));

-- 2. Voeg template_id toe aan offertes
ALTER TABLE offertes
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'professional'
    CHECK (template_id IN ('professional', 'premium', 'compact'));

-- 3. Voeg template_id toe aan facturen
ALTER TABLE facturen
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'professional'
    CHECK (template_id IN ('professional', 'premium', 'compact'));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_offertes_template_id ON offertes (template_id);
CREATE INDEX IF NOT EXISTS idx_facturen_template_id ON facturen (template_id);

COMMENT ON COLUMN bedrijven.default_quote_template IS 'Standaard template voor nieuwe offertes';
COMMENT ON COLUMN bedrijven.default_invoice_template IS 'Standaard template voor nieuwe facturen';
COMMENT ON COLUMN bedrijven.default_advance_template IS 'Standaard template voor voorschotfacturen';
COMMENT ON COLUMN offertes.template_id IS 'Documenttemplate: professional, premium of compact';
COMMENT ON COLUMN facturen.template_id IS 'Documenttemplate: professional, premium of compact';

