-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260501164230
-- Production name: fix_document_sequences_constraint

-- Update check constraint to use Dutch document type names (consistent with app)
ALTER TABLE document_sequences DROP CONSTRAINT document_sequences_document_type_check;
ALTER TABLE document_sequences ADD CONSTRAINT document_sequences_document_type_check
  CHECK (document_type IN ('offerte','factuur','credit_nota','proforma'));

-- Recreate the function with correct logic
CREATE OR REPLACE FUNCTION generate_document_number(
  p_company_id     BIGINT,
  p_document_type  TEXT
) RETURNS TEXT AS $$
DECLARE
  v_prefix  TEXT;
  v_next    INTEGER;
  v_year    INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  v_prefix := CASE p_document_type
    WHEN 'offerte'     THEN 'OFF'
    WHEN 'factuur'     THEN 'FAC'
    WHEN 'credit_nota' THEN 'CN'
    WHEN 'proforma'    THEN 'PRO'
    ELSE UPPER(LEFT(p_document_type, 3))
  END;

  INSERT INTO document_sequences (company_id, document_type, year, current_value, prefix)
  VALUES (p_company_id, p_document_type, v_year, 0, v_prefix)
  ON CONFLICT (company_id, document_type, year) DO NOTHING;

  UPDATE document_sequences
  SET current_value = current_value + 1,
      updated_at    = NOW()
  WHERE company_id    = p_company_id
    AND document_type = p_document_type
    AND year          = v_year
  RETURNING prefix, current_value
  INTO v_prefix, v_next;

  RETURN v_prefix || '-' || v_year::text || '-' || lpad(v_next::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

