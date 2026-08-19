-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327174921
-- Production name: 005_customer_portal
-- ============================================================================
-- CUSTOMER PORTAL MIGRATION
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers table (klantrecords in CRM)
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  -- Contact info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Business info
  company_name VARCHAR(255),
  kvk VARCHAR(20),
  btw VARCHAR(20),
  
  -- Portal status
  portal_enabled BOOLEAN DEFAULT false,
  portal_invited_at TIMESTAMP WITH TIME ZONE,
  portal_activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT customers_email_company_unique UNIQUE(email, company_id)
);

-- 2. Portal Users (authentication identities)
CREATE TABLE IF NOT EXISTS customer_portal_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT portal_users_customer_unique UNIQUE(customer_id)
);

-- 3. Portal Invitations
CREATE TABLE IF NOT EXISTS customer_portal_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Documents (for file tracking)
CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  document_type VARCHAR(50) NOT NULL 
    CHECK (document_type IN ('quote', 'invoice', 'contract', 'other')),
  document_id BIGINT,
  
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  
  title VARCHAR(255),
  description TEXT,
  is_visible_in_portal BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit Log
CREATE TABLE IF NOT EXISTS customer_portal_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  portal_user_id UUID REFERENCES customer_portal_users(id) ON DELETE SET NULL,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to existing tables
ALTER TABLE bedrijven ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE bedrijven ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE offertes ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE offertes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE inkomsten ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE inkomsten ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE contacten ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE afspraken ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE betalingen ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE artikelen ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE abonnementen ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE uitgaven ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_portal_enabled ON customers(portal_enabled);
CREATE INDEX IF NOT EXISTS idx_portal_users_customer_id ON customer_portal_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_auth_user_id ON customer_portal_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_company_id ON customer_portal_users(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON customer_portal_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_customer_id ON customer_portal_invitations(customer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON customer_portal_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON customer_portal_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON customer_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON customer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_portal_user_id ON customer_portal_audit_log(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_customer_id ON customer_portal_audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON customer_portal_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON customer_portal_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_offertes_customer_id ON offertes(customer_id);
CREATE INDEX IF NOT EXISTS idx_offertes_user_id ON offertes(user_id);
CREATE INDEX IF NOT EXISTS idx_inkomsten_customer_id ON inkomsten(customer_id);
CREATE INDEX IF NOT EXISTS idx_inkomsten_user_id ON inkomsten(user_id);

-- Triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portal_users_updated_at ON customer_portal_users;
CREATE TRIGGER update_portal_users_updated_at
  BEFORE UPDATE ON customer_portal_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitations_updated_at ON customer_portal_invitations;
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON customer_portal_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON customer_documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_internal_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM customer_portal_users 
    WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT id FROM bedrijven 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

