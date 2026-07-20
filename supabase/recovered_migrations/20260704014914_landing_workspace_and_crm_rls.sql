-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260704014914
-- Production name: landing_workspace_and_crm_rls
-- Fix company resolution for CRM writes
CREATE OR REPLACE FUNCTION app_private.get_user_company_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select cm.company_id
  from public.company_memberships cm
  where cm.user_id = auth.uid()
    and cm.is_active is true
  order by cm.joined_at asc nulls last, cm.id asc
  limit 1;
$function$;

-- Auto-provision bedrijf + membership for landing page users
CREATE OR REPLACE FUNCTION public.provision_landing_workspace(
  p_company_name text DEFAULT NULL,
  p_user_name text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id bigint;
  v_company_name text;
  v_user_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cm.company_id INTO v_company_id
  FROM public.company_memberships cm
  WHERE cm.user_id = v_user_id
    AND cm.is_active IS TRUE
  ORDER BY cm.joined_at ASC NULLS LAST, cm.id ASC
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  v_company_name := NULLIF(trim(p_company_name), '');
  v_user_name := NULLIF(trim(p_user_name), '');

  IF v_company_name IS NULL THEN
    SELECT COALESCE(
      u.raw_user_meta_data->>'company',
      split_part(u.email, '@', 1),
      'Mijn bedrijf'
    )
    INTO v_company_name
    FROM auth.users u
    WHERE u.id = v_user_id;
  END IF;

  IF v_user_name IS NULL THEN
    SELECT COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1),
      'Gebruiker'
    )
    INTO v_user_name
    FROM auth.users u
    WHERE u.id = v_user_id;
  END IF;

  INSERT INTO public.bedrijven (naam, user_id, owner_user_id, is_active)
  VALUES (v_company_name, v_user_id, v_user_id, TRUE)
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_memberships (
    user_id, company_id, role, is_active, joined_at, activated_at
  )
  VALUES (v_user_id, v_company_id, 'owner', TRUE, now(), now());

  UPDATE public.profiles
  SET
    full_name = COALESCE(NULLIF(full_name, ''), v_user_name),
    updated_at = now()
  WHERE id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_landing_workspace(text, text) TO authenticated;

-- Deals: allow pipeline drag & drop
DROP POLICY IF EXISTS "Allow authenticated update on deals" ON public.deals;
CREATE POLICY "Allow authenticated update on deals"
  ON public.deals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = deals.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active IS TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = deals.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active IS TRUE
    )
  );

-- Customers: allow writes for active company members
DROP POLICY IF EXISTS "Members can insert customers" ON public.customers;
CREATE POLICY "Members can insert customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = customers.company_id
        AND cm.user_id = auth.uid()
        AND cm.is_active IS TRUE
    )
  );

DROP POLICY IF EXISTS "Members can update customers" ON public.customers;
CREATE POLICY "Members can update customers"
  ON public.customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = customers.company_id
        AND cm.user_id = auth.uid()
        AND cm.is_active IS TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = customers.company_id
        AND cm.user_id = auth.uid()
        AND cm.is_active IS TRUE
    )
  );

DROP POLICY IF EXISTS "Members can delete customers" ON public.customers;
CREATE POLICY "Members can delete customers"
  ON public.customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = customers.company_id
        AND cm.user_id = auth.uid()
        AND cm.is_active IS TRUE
    )
  );

