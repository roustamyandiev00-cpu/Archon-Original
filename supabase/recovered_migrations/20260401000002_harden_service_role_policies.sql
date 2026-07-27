-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260401000002
-- Production name: harden_service_role_policies
-- Harden overly permissive service role policies identified in the security audit.
-- These policies were previously allowing any user to perform actions because the 'TO' role was missing.

-- 1. customer_portal_users
DROP POLICY IF EXISTS "Service role insert portal users" ON public.customer_portal_users;

-- Recovered statement 2
CREATE POLICY "Service role insert portal users" ON public.customer_portal_users
  FOR INSERT TO service_role WITH CHECK (true);

-- Recovered statement 3
-- 2. customer_portal_invitations
DROP POLICY IF EXISTS "Service role update invitations" ON public.customer_portal_invitations;

-- Recovered statement 4
CREATE POLICY "Service role update invitations" ON public.customer_portal_invitations
  FOR UPDATE TO service_role USING (true);

-- Recovered statement 5
-- 3. customer_portal_audit_log
DROP POLICY IF EXISTS "Service role insert audit" ON public.customer_portal_audit_log;

-- Recovered statement 6
CREATE POLICY "Service role insert audit" ON public.customer_portal_audit_log
  FOR INSERT TO service_role WITH CHECK (true);

-- Recovered statement 7
COMMENT ON TABLE public.customer_portal_users IS 'Harden RLS: restricted service role insert to actual service_role.';

-- Recovered statement 8
COMMENT ON TABLE public.customer_portal_invitations IS 'Harden RLS: restricted service role update to actual service_role.';

-- Recovered statement 9
COMMENT ON TABLE public.customer_portal_audit_log IS 'Harden RLS: restricted service role insert to actual service_role.';

