-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260328140000
-- Production name: membership_rls_helpers
-- Membership RLS: helpers + policies + row_security off (was 034 + 035 in numbered migrations).

CREATE OR REPLACE FUNCTION public.is_company_owner_record(
  p_company_id BIGINT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'bedrijven'
      AND c.column_name = 'owner_user_id'
  ) THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.bedrijven b
      WHERE b.id = p_company_id
        AND COALESCE(b.owner_user_id, b.user_id) = p_user_id
    );
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.bedrijven b
    WHERE b.id = p_company_id
      AND b.user_id = p_user_id
  );
END;
$$;

-- Recovered statement 2
CREATE OR REPLACE FUNCTION public.get_user_role_in_company(p_company_id BIGINT)
RETURNS VARCHAR
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT cm.role::varchar
  FROM public.company_memberships cm
  WHERE cm.user_id = auth.uid()
    AND cm.company_id = p_company_id
    AND cm.is_active = true
  LIMIT 1;
$$;

-- Recovered statement 3
CREATE OR REPLACE FUNCTION public.is_member_of_company(p_company_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = auth.uid()
      AND cm.company_id = p_company_id
      AND cm.is_active = true
  );
$$;

-- Recovered statement 4
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(p_company_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = auth.uid()
      AND cm.company_id = p_company_id
      AND cm.is_active = true
      AND cm.role IN ('owner', 'admin')
  );
$$;

-- Recovered statement 5
CREATE OR REPLACE FUNCTION public.is_owner(p_company_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = auth.uid()
      AND cm.company_id = p_company_id
      AND cm.is_active = true
      AND cm.role = 'owner'
  );
$$;

-- Recovered statement 6
DROP POLICY IF EXISTS "Members view company memberships" ON public.company_memberships;

-- Recovered statement 7
DROP POLICY IF EXISTS "Owner/admin insert memberships" ON public.company_memberships;

-- Recovered statement 8
DROP POLICY IF EXISTS "Owner/admin update memberships" ON public.company_memberships;

-- Recovered statement 9
DROP POLICY IF EXISTS "Owner delete memberships" ON public.company_memberships;

-- Recovered statement 10
DROP POLICY IF EXISTS "Users view own memberships or owned company memberships" ON public.company_memberships;

-- Recovered statement 11
DROP POLICY IF EXISTS "Owners insert memberships" ON public.company_memberships;

-- Recovered statement 12
DROP POLICY IF EXISTS "Owners update memberships" ON public.company_memberships;

-- Recovered statement 13
DROP POLICY IF EXISTS "Owners delete memberships" ON public.company_memberships;

-- Recovered statement 14
CREATE POLICY "Users view own memberships or owned company memberships"
  ON public.company_memberships
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user()
    AND (
      user_id = (SELECT auth.uid())
      OR public.is_company_owner_record(company_id)
    )
  );

-- Recovered statement 15
CREATE POLICY "Owners insert memberships"
  ON public.company_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user()
    AND public.is_company_owner_record(company_id)
  );

-- Recovered statement 16
CREATE POLICY "Owners update memberships"
  ON public.company_memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user()
    AND public.is_company_owner_record(company_id)
  )
  WITH CHECK (
    public.is_internal_user()
    AND public.is_company_owner_record(company_id)
  );

-- Recovered statement 17
CREATE POLICY "Owners delete memberships"
  ON public.company_memberships
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_user()
    AND public.is_company_owner_record(company_id)
  );

-- Recovered statement 18
GRANT EXECUTE ON FUNCTION public.get_user_role_in_company(BIGINT) TO authenticated, service_role;

-- Recovered statement 19
GRANT EXECUTE ON FUNCTION public.is_member_of_company(BIGINT) TO authenticated, service_role;

-- Recovered statement 20
GRANT EXECUTE ON FUNCTION public.is_owner_or_admin(BIGINT) TO authenticated, service_role;

-- Recovered statement 21
GRANT EXECUTE ON FUNCTION public.is_owner(BIGINT) TO authenticated, service_role;

-- Recovered statement 22
GRANT EXECUTE ON FUNCTION public.is_company_owner_record(BIGINT, UUID) TO authenticated, service_role;

-- Recovered statement 23
COMMENT ON FUNCTION public.get_user_role_in_company(BIGINT) IS
  'SECURITY DEFINER + row_security off: leest company_memberships zonder RLS-recursie.';

