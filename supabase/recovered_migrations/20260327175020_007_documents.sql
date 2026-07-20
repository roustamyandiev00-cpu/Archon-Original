-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327175020
-- Production name: 007_documents
-- Documents table migration
-- Centrale documentopslag voor ArchonPro

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  -- Bestandsinformatie
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Categorie en beschrijving
  category VARCHAR(50) NOT NULL DEFAULT 'overig' 
    CHECK (category IN ('offerte', 'factuur', 'contract', 'werffoto', 'bestelbon', 'technisch', 'overig')),
  description TEXT,
  
  -- Koppeling met andere entiteiten
  related_entity_type VARCHAR(50) 
    CHECK (related_entity_type IN ('customer', 'offerte', 'factuur', 'project')),
  related_entity_id BIGINT,
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  
  CONSTRAINT documents_size_check CHECK (size_bytes > 0 AND size_bytes < 52428800) -- Max 50MB
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_related_entity ON documents(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Interne gebruikers: alleen eigen bedrijf
CREATE POLICY "Documents - interne gebruikers" ON documents
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM bedrijven WHERE user_id = auth.uid()
    )
  );

-- Portal gebruikers: alleen publieke documenten of eigen klant
CREATE POLICY "Documents - portal users" ON documents
  FOR SELECT
  USING (
    is_public = true OR
    (
      related_entity_type = 'customer' AND
      related_entity_id IN (
        SELECT customer_id FROM customer_portal_users 
        WHERE auth_user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Automatische updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

