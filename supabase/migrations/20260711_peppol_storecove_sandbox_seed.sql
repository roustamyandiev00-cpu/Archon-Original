-- Peppol sandbox seed voor bedrijf 10 (Janssen Bouw BV) + testfactuur reset
UPDATE company_einvoicing_settings
SET is_enabled = true, environment = 'sandbox', updated_at = now()
WHERE bedrijf_id = 10;

UPDATE bedrijven
SET iban = 'BE76363008033906', kvk = '0123456789', updated_at = now()
WHERE id = 10;

UPDATE company_legal_entities
SET iban = 'BE76363008033906', enterprise_number = '0123456789', updated_at = now()
WHERE bedrijf_id = 10;

UPDATE integraties
SET
  config = jsonb_build_object(
    'accessPoint', 'storecove',
    'participantId', '0208:0123456789',
    'apiKey', '',
    'legalEntityId', '',
    'sandbox', 'true'
  ),
  status = 'connected',
  updated_at = now()
WHERE bedrijf_id = 10 AND provider = 'peppol';

UPDATE facturen
SET peppol_status = 'niet_verzonden', peppol_last_error = NULL, updated_at = now()
WHERE id = 1 AND bedrijf_id = 10;
