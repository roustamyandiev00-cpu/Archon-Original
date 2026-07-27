-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327224032
-- Production name: 030_rls_performance_optimization
-- ============================================
-- RLS Performance Optimization Migration
-- Fixes: auth_rls_initplan warnings
-- Replace auth.uid() with (SELECT auth.uid()) for better performance
-- ============================================

-- Helper function to get current user ID once (reduces RLS overhead)
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Fix profiles RLS policies
-- ============================================

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth_user_id() = id)
    WITH CHECK (auth_user_id() = id);

-- ============================================
-- Fix customer_portal_users RLS policies
-- ============================================

DROP POLICY IF EXISTS "Users can view portal users" ON public.customer_portal_users;
CREATE POLICY "Users can view portal users"
    ON public.customer_portal_users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_portal_users.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert portal users" ON public.customer_portal_users;
CREATE POLICY "Internal users can insert portal users"
    ON public.customer_portal_users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_portal_users.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role IN ('admin', 'finance')
        )
    );

DROP POLICY IF EXISTS "Internal users can update portal users" ON public.customer_portal_users;
CREATE POLICY "Internal users can update portal users"
    ON public.customer_portal_users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_portal_users.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role IN ('admin', 'finance')
        )
    );

DROP POLICY IF EXISTS "Internal users can delete portal users" ON public.customer_portal_users;
CREATE POLICY "Internal users can delete portal users"
    ON public.customer_portal_users FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_portal_users.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- ============================================
-- Fix customer_portal_audit_log RLS policies
-- ============================================

DROP POLICY IF EXISTS "Portal users insert own audit" ON public.customer_portal_audit_log;
CREATE POLICY "Portal users insert own audit"
    ON public.customer_portal_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id() = portal_user_id);

COMMENT ON FUNCTION public.auth_user_id() IS 'Helper function to cache auth.uid() for RLS policy performance';

