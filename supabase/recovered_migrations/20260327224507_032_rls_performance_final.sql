-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327224507
-- Production name: 032_rls_performance_final
-- ============================================
-- RLS Performance Optimization - Final Part
-- Fix remaining auth_rls_initplan warnings
-- ============================================

-- Fix facturen policies
DROP POLICY IF EXISTS "Users can view facturen" ON public.facturen;
CREATE POLICY "Users can view facturen"
    ON public.facturen FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = facturen.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert facturen" ON public.facturen;
CREATE POLICY "Internal users can insert facturen"
    ON public.facturen FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = facturen.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can update facturen" ON public.facturen;
CREATE POLICY "Internal users can update facturen"
    ON public.facturen FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = facturen.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can delete facturen" ON public.facturen;
CREATE POLICY "Internal users can delete facturen"
    ON public.facturen FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = facturen.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- Fix offertes policies
DROP POLICY IF EXISTS "Users can view offertes" ON public.offertes;
CREATE POLICY "Users can view offertes"
    ON public.offertes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = offertes.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert offertes" ON public.offertes;
CREATE POLICY "Internal users can insert offertes"
    ON public.offertes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = offertes.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can update offertes" ON public.offertes;
CREATE POLICY "Internal users can update offertes"
    ON public.offertes FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = offertes.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can delete offertes" ON public.offertes;
CREATE POLICY "Internal users can delete offertes"
    ON public.offertes FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = offertes.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- Fix inkomsten policies
DROP POLICY IF EXISTS "Users can view inkomsten" ON public.inkomsten;
CREATE POLICY "Users can view inkomsten"
    ON public.inkomsten FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = inkomsten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can insert inkomsten" ON public.inkomsten;
CREATE POLICY "Internal users can insert inkomsten"
    ON public.inkomsten FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = inkomsten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can update inkomsten" ON public.inkomsten;
CREATE POLICY "Internal users can update inkomsten"
    ON public.inkomsten FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = inkomsten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users can delete inkomsten" ON public.inkomsten;
CREATE POLICY "Internal users can delete inkomsten"
    ON public.inkomsten FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = inkomsten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- Fix reminders policies
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
CREATE POLICY "Users can view own reminders"
    ON public.reminders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = reminders.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can create own reminders" ON public.reminders;
CREATE POLICY "Users can create own reminders"
    ON public.reminders FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = reminders.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
CREATE POLICY "Users can update own reminders"
    ON public.reminders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = reminders.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;
CREATE POLICY "Users can delete own reminders"
    ON public.reminders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = reminders.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix ai_messages insert policy
DROP POLICY IF EXISTS "Berichten kunnen worden toegevoegd aan eigen chats" ON public.ai_messages;
CREATE POLICY "Berichten kunnen worden toegevoegd aan eigen chats"
    ON public.ai_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_chats
            WHERE ai_chats.id = ai_messages.chat_id
            AND ai_chats.user_id = auth_user_id()
        )
    );

-- Fix User table policies (quoted identifier)
DROP POLICY IF EXISTS "Users can only view own profile" ON "User";
CREATE POLICY "Users can only view own profile"
    ON "User" FOR SELECT
    TO authenticated
    USING (auth_user_id()::text = id);

DROP POLICY IF EXISTS "Users can only update own profile" ON "User";
CREATE POLICY "Users can only update own profile"
    ON "User" FOR UPDATE
    TO authenticated
    USING (auth_user_id()::text = id);

