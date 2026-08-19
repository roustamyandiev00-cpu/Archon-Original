-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260403000001
-- Production name: add_custom_permissions
-- Add custom_permissions to company_memberships
-- Allows admin to override role defaults per user
-- Structure: { "allow": ["permission.key", ...], "deny": ["permission.key", ...] }

ALTER TABLE company_memberships
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '{}'::jsonb;

-- Recovered statement 2
COMMENT ON COLUMN company_memberships.custom_permissions IS
  'Per-user permission overrides. allow[] grants extra perms, deny[] removes role perms.';

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_company_memberships_custom_permissions
  ON company_memberships USING gin (custom_permissions);

