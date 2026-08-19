-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327224320
-- Production name: 031_rls_performance_part2
-- ============================================
-- RLS Performance Optimization - Part 2
-- Fix remaining auth_rls_initplan warnings
-- ============================================

-- Fix bedrijven policies
DROP POLICY IF EXISTS "Internal users select own company" ON public.bedrijven;
CREATE POLICY "Internal users select own company"
    ON public.bedrijven FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = bedrijven.id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Internal users update own company" ON public.bedrijven;
CREATE POLICY "Internal users update own company"
    ON public.bedrijven FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = bedrijven.id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
            AND cm.role = 'admin'
        )
    );

-- Fix contacten policies
DROP POLICY IF EXISTS "Allow authenticated select on contacten" ON public.contacten;
CREATE POLICY "Allow authenticated select on contacten"
    ON public.contacten FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = contacten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Allow authenticated insert on contacten" ON public.contacten;
CREATE POLICY "Allow authenticated insert on contacten"
    ON public.contacten FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = contacten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix deals policies
DROP POLICY IF EXISTS "Allow authenticated select on deals" ON public.deals;
CREATE POLICY "Allow authenticated select on deals"
    ON public.deals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = deals.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Allow authenticated insert on deals" ON public.deals;
CREATE POLICY "Allow authenticated insert on deals"
    ON public.deals FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = deals.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix projecten policies
DROP POLICY IF EXISTS "Allow authenticated select on projecten" ON public.projecten;
CREATE POLICY "Allow authenticated select on projecten"
    ON public.projecten FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = projecten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

DROP POLICY IF EXISTS "Allow authenticated insert on projecten" ON public.projecten;
CREATE POLICY "Allow authenticated insert on projecten"
    ON public.projecten FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = projecten.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix uitgaven policies
DROP POLICY IF EXISTS "Allow authenticated select on uitgaven" ON public.uitgaven;
CREATE POLICY "Allow authenticated select on uitgaven"
    ON public.uitgaven FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = uitgaven.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix artikelen policies
DROP POLICY IF EXISTS "Allow authenticated select on artikelen" ON public.artikelen;
CREATE POLICY "Allow authenticated select on artikelen"
    ON public.artikelen FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = artikelen.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix timesheets policies (uses user_id directly)
DROP POLICY IF EXISTS "Allow authenticated select on timesheets" ON public.timesheets;
CREATE POLICY "Allow authenticated select on timesheets"
    ON public.timesheets FOR SELECT
    TO authenticated
    USING (auth_user_id() = user_id);

-- Fix betalingen policies
DROP POLICY IF EXISTS "Allow authenticated select on betalingen" ON public.betalingen;
CREATE POLICY "Allow authenticated select on betalingen"
    ON public.betalingen FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = betalingen.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix afspraken policies
DROP POLICY IF EXISTS "Allow authenticated select on afspraken" ON public.afspraken;
CREATE POLICY "Allow authenticated select on afspraken"
    ON public.afspraken FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = afspraken.bedrijf_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix abonnementen policies
DROP POLICY IF EXISTS "Allow authenticated select on abonnementen" ON public.abonnementen;
CREATE POLICY "Allow authenticated select on abonnementen"
    ON public.abonnementen FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = abonnementen.company_id
            AND cm.user_id = auth_user_id()
            AND cm.is_active = true
        )
    );

-- Fix ai_chats policies
DROP POLICY IF EXISTS "Gebruikers kunnen hun eigen chats zien" ON public.ai_chats;
CREATE POLICY "Gebruikers kunnen hun eigen chats zien"
    ON public.ai_chats FOR SELECT
    TO authenticated
    USING (auth_user_id() = user_id);

DROP POLICY IF EXISTS "Gebruikers kunnen eigen chats aanmaken" ON public.ai_chats;
CREATE POLICY "Gebruikers kunnen eigen chats aanmaken"
    ON public.ai_chats FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id() = user_id);

DROP POLICY IF EXISTS "Gebruikers kunnen eigen chats updaten" ON public.ai_chats;
CREATE POLICY "Gebruikers kunnen eigen chats updaten"
    ON public.ai_chats FOR UPDATE
    TO authenticated
    USING (auth_user_id() = user_id);

DROP POLICY IF EXISTS "Gebruikers kunnen eigen chats verwijderen" ON public.ai_chats;
CREATE POLICY "Gebruikers kunnen eigen chats verwijderen"
    ON public.ai_chats FOR DELETE
    TO authenticated
    USING (auth_user_id() = user_id);

-- Fix ai_messages policies
DROP POLICY IF EXISTS "Berichten zijn zichtbaar via de chat eigenaar" ON public.ai_messages;
CREATE POLICY "Berichten zijn zichtbaar via de chat eigenaar"
    ON public.ai_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_chats
            WHERE ai_chats.id = ai_messages.chat_id
            AND ai_chats.user_id = auth_user_id()
        )
    );

