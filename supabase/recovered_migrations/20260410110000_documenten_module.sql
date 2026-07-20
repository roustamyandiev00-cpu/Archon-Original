-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410110000
-- Production name: documenten_module
-- Migration: Documentbeheer Module
-- Fase 4: Centrale documentmodule met koppelingen

-- ============================================================================
-- DOCUMENTEN TABEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS documenten (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  -- Bestand info
  original_filename VARCHAR(500) NOT NULL,
  stored_filename VARCHAR(500) NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Categorie
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'offerte', 'factuur', 'contract', 'werffoto', 'bestelbon', 'technisch', 'overig'
  )),
  
  -- Koppeling (optioneel, polymorphic)
  related_type VARCHAR(50), -- 'customer', 'quotation', 'invoice', 'project', 'task'
  related_id BIGINT,
  
  -- Upload info
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  -- Storage (Supabase Storage reference)
  storage_bucket VARCHAR(100) DEFAULT 'documents',
  storage_path VARCHAR(500) NOT NULL,
  
  -- Soft delete
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT chk_related CHECK (
    (related_type IS NULL AND related_id IS NULL) OR
    (related_type IS NOT NULL AND related_id IS NOT NULL)
  )
);

-- Recovered statement 2
-- Indexen voor performance
CREATE INDEX IF NOT EXISTS idx_documenten_company ON documenten(company_id);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_documenten_related ON documenten(related_type, related_id) WHERE deleted_at IS NULL;

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS idx_documenten_category ON documenten(category);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS idx_documenten_uploaded_at ON documenten(uploaded_at DESC);

-- Recovered statement 6
-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE documenten ENABLE ROW LEVEL SECURITY;

-- Recovered statement 7
-- Policy: Gebruikers zien alleen documenten van hun eigen bedrijf
CREATE POLICY "documenten_select_own_company" ON documenten
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND deleted_at IS NULL
  );

-- Recovered statement 8
-- Policy: Gebruikers kunnen uploaden voor hun bedrijf
CREATE POLICY "documenten_insert_own_company" ON documenten
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 9
-- Policy: Alleen uploader of admin kan verwijderen (soft delete)
CREATE POLICY "documenten_delete_own_or_admin" ON documenten
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
      AND (role = 'owner' OR role = 'admin' OR user_id = uploaded_by)
    )
    AND deleted_at IS NULL
  );

-- Recovered statement 10
-- ============================================================================
-- STORAGE BUCKET SETUP (uit te voeren in Supabase dashboard)
-- ============================================================================

-- Bucket 'documents' aanmaken met restricties:
-- - Max file size: 50MB
-- - Allowed mime types: application/pdf, image/*
-- - Public access: false (private files)

-- ============================================================================
-- HELPER FUNCTIE: Document toevoegen met activity log
-- ============================================================================

CREATE OR REPLACE FUNCTION add_document(
  p_company_id BIGINT,
  p_original_filename VARCHAR,
  p_stored_filename VARCHAR,
  p_file_size BIGINT,
  p_mime_type VARCHAR,
  p_category VARCHAR,
  p_related_type VARCHAR DEFAULT NULL,
  p_related_id BIGINT DEFAULT NULL,
  p_storage_path VARCHAR DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_document_id BIGINT;
  v_user_id UUID := auth.uid();
BEGIN
  INSERT INTO documenten (
    company_id,
    original_filename,
    stored_filename,
    file_size,
    mime_type,
    category,
    related_type,
    related_id,
    storage_path,
    uploaded_by
  ) VALUES (
    p_company_id,
    p_original_filename,
    p_stored_filename,
    p_file_size,
    p_mime_type,
    p_category,
    p_related_type,
    p_related_id,
    COALESCE(p_storage_path, p_stored_filename),
    v_user_id
  )
  RETURNING id INTO v_document_id;
  
  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recovered statement 11
-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE documenten IS 'Centrale documentopslag met koppelingen naar klanten, offertes, facturen en projecten';

-- Recovered statement 12
COMMENT ON COLUMN documenten.category IS 'Documentcategorie: offerte, factuur, contract, werffoto, bestelbon, technisch, overig';

-- Recovered statement 13
COMMENT ON COLUMN documenten.related_type IS 'Type gekoppeld record: customer, quotation, invoice, project, task';

-- Recovered statement 14
COMMENT ON COLUMN documenten.storage_path IS 'Pad in Supabase Storage bucket';

