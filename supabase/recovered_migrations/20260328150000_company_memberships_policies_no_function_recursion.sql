-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260328150000
-- Production name: company_memberships_policies_no_function_recursion
-- company_memberships: policies zonder aanroep van is_company_owner_record / helpers in de policy zelf.
-- Direct EXISTS op bedrijven (alleen user_id) voorkomt policy→functie→RLS→company_memberships loops.
-- (owner_user_id kan later in een aparte migratie als de kolom overal bestaat.)

DROP POLICY IF EXISTS "Users view own memberships or owned company memberships" ON public.company_memberships;

-- Recovered statement 2
DROP POLICY IF EXISTS "Owners insert memberships" ON public.company_memberships;

-- Recovered statement 3
DROP POLICY IF EXISTS "Owners update memberships" ON public.company_memberships;

-- Recovered statement 4
DROP POLICY IF EXISTS "Owners delete memberships" ON public.company_memberships;

-- Recovered statement 5
CREATE POLICY "Users view own memberships or owned company memberships"
  ON public.company_memberships
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user()
    AND (
      user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.bedrijven b
        WHERE b.id = company_memberships.company_id
          AND b.user_id = (SELECT auth.uid())
      )
    )
  );

-- Recovered statement 6
CREATE POLICY "Owners insert memberships"
  ON public.company_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user()
    AND EXISTS (
      SELECT 1
      FROM public.bedrijven b
      WHERE b.id = company_memberships.company_id
        AND b.user_id = (SELECT auth.uid())
    )
  );

-- Recovered statement 7
CREATE POLICY "Owners update memberships"
  ON public.company_memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user()
    AND EXISTS (
      SELECT 1
      FROM public.bedrijven b
      WHERE b.id = company_memberships.company_id
        AND b.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    public.is_internal_user()
    AND EXISTS (
      SELECT 1
      FROM public.bedrijven b
      WHERE b.id = company_memberships.company_id
        AND b.user_id = (SELECT auth.uid())
    )
  );

-- Recovered statement 8
CREATE POLICY "Owners delete memberships"
  ON public.company_memberships
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_user()
    AND EXISTS (
      SELECT 1
      FROM public.bedrijven b
      WHERE b.id = company_memberships.company_id
        AND b.user_id = (SELECT auth.uid())
    )
  );

