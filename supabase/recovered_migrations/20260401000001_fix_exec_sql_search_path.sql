-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260401000001
-- Production name: fix_exec_sql_search_path
-- Fix security vulnerability in exec_sql function by setting an explicit search_path.
-- This prevents search_path hijacking attacks when using SECURITY DEFINER functions.
-- Drop first to handle return type conflicts with existing versions.

DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Recovered statement 2
CREATE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Recovered statement 3
COMMENT ON FUNCTION public.exec_sql(text) IS 'Utility function to execute SQL strings with secured search_path.';

