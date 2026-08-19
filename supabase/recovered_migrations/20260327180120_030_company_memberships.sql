-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327180120
-- Production name: 030_company_memberships
-- Company memberships table for role-based permissions
CREATE TABLE IF NOT EXISTS company_memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'employee'
    CHECK (role IN ('owner', 'admin', 'sales', 'project_manager', 'finance', 'employee')),
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_memberships_user_id ON company_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_role ON company_memberships(company_id, role);

-- RLS
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON company_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Company owners/admins can manage memberships for their company
CREATE POLICY "Company owners can manage memberships" ON company_memberships
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_company_memberships_updated_at ON company_memberships;
CREATE TRIGGER trigger_company_memberships_updated_at
  BEFORE UPDATE ON company_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_company_memberships_updated_at();

