-- Add token_limit column to company_ai_credits table
-- This allows admins to set per-company token limits for trial users

ALTER TABLE public.company_ai_credits
ADD COLUMN IF NOT EXISTS token_limit bigint DEFAULT NULL;

COMMENT ON COLUMN public.company_ai_credits.token_limit IS 
'Maximum tokens allowed for this company (NULL = unlimited). Used for trial period limits and quota management.';

-- Create index for filtering companies by limit status
CREATE INDEX IF NOT EXISTS idx_company_ai_credits_token_limit 
ON public.company_ai_credits(token_limit) 
WHERE token_limit IS NOT NULL;

-- Add helper function to check if company has exceeded token limit
CREATE OR REPLACE FUNCTION public.check_token_limit_exceeded(p_company_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit bigint;
  v_used bigint;
BEGIN
  SELECT token_limit, credits_used
  INTO v_limit, v_used
  FROM public.company_ai_credits
  WHERE company_id = p_company_id;

  -- No limit set = unlimited
  IF v_limit IS NULL THEN
    RETURN false;
  END IF;

  -- Check if used exceeds limit
  RETURN v_used >= v_limit;
END;
$$;

COMMENT ON FUNCTION public.check_token_limit_exceeded IS
'Returns true if company has exceeded their token limit. Returns false if no limit is set (unlimited).';
