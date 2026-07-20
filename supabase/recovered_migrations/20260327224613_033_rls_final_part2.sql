-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327224613
-- Production name: 033_rls_final_part2
-- ============================================
-- RLS Performance Optimization - Last Part
-- Fix remaining auth_rls_initplan warnings
-- ============================================

-- Fix tasks policies
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
CREATE POLICY "Users can view tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = tasks.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert tasks" ON public.tasks;
CREATE POLICY "Internal users can insert tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = tasks.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can update tasks" ON public.tasks;
CREATE POLICY "Internal users can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = tasks.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can delete tasks" ON public.tasks;
CREATE POLICY "Internal users can delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = tasks.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix customers policies
DROP POLICY IF EXISTS "Users can view customers" ON public.customers;
CREATE POLICY "Users can view customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customers.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix documents policies
DROP POLICY IF EXISTS "Users can view documents" ON public.documents;
CREATE POLICY "Users can view documents"
    ON public.documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert documents" ON public.documents;
CREATE POLICY "Internal users can insert documents"
    ON public.documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can update documents" ON public.documents;
CREATE POLICY "Internal users can update documents"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can delete documents" ON public.documents;
CREATE POLICY "Internal users can delete documents"
    ON public.documents FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- Fix company_memberships policies
DROP POLICY IF EXISTS "Users can view memberships" ON public.company_memberships;
CREATE POLICY "Users can view memberships"
    ON public.company_memberships FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm2
            WHERE cm2.company_id = company_memberships.company_id
            AND cm2.user_id = auth_user_id()
            AND cm2.is_active = true
        )
    );

DROP POLICY IF EXISTS "Company owners can insert memberships" ON public.company_memberships;
CREATE POLICY "Company owners can insert memberships"
    ON public.company_memberships FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = company_memberships.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company owners can update memberships" ON public.company_memberships;
CREATE POLICY "Company owners can update memberships"
    ON public.company_memberships FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = company_memberships.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Company owners can delete memberships" ON public.company_memberships;
CREATE POLICY "Company owners can delete memberships"
    ON public.company_memberships FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = company_memberships.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- Fix customer_documents policies
DROP POLICY IF EXISTS "Users can view customer documents" ON public.customer_documents;
CREATE POLICY "Users can view customer documents"
    ON public.customer_documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert customer documents" ON public.customer_documents;
CREATE POLICY "Internal users can insert customer documents"
    ON public.customer_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can update customer documents" ON public.customer_documents;
CREATE POLICY "Internal users can update customer documents"
    ON public.customer_documents FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can delete customer documents" ON public.customer_documents;
CREATE POLICY "Internal users can delete customer documents"
    ON public.customer_documents FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = customer_documents.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

