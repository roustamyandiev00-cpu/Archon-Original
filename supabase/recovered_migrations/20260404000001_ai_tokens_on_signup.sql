-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260404000001
-- Production name: ai_tokens_on_signup
-- Automatisch AI tokens toekennen bij registratie en plan upgrade
-- Gratis plan: 100 tokens, Starter: 1000 tokens, Pro: 5000 tokens

-- Token limieten per plan
CREATE TABLE IF NOT EXISTS public.plan_ai_token_limits (
  plan VARCHAR(50) PRIMARY KEY,
  tokens_on_signup INTEGER NOT NULL DEFAULT 0,
  monthly_tokens INTEGER NOT NULL DEFAULT 0,
  voice_enabled BOOLEAN NOT NULL DEFAULT false
);

-- Recovered statement 2
INSERT INTO public.plan_ai_token_limits (plan, tokens_on_signup, monthly_tokens, voice_enabled) VALUES
  ('free',       100,  100,  false),
  ('starter',   1000, 1000,  true),
  ('pro',       5000, 5000,  true),
  ('enterprise', 99999, 99999, true)
ON CONFLICT (plan) DO UPDATE SET
  tokens_on_signup = EXCLUDED.tokens_on_signup,
  monthly_tokens   = EXCLUDED.monthly_tokens,
  voice_enabled    = EXCLUDED.voice_enabled;

-- Recovered statement 3
-- Voeg credits_used kolom toe als die nog niet bestaat
ALTER TABLE public.company_ai_credits
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0;

-- Recovered statement 4
-- Voeg low_balance_notified toe om dubbele meldingen te voorkomen
ALTER TABLE public.company_ai_credits
  ADD COLUMN IF NOT EXISTS low_balance_notified BOOLEAN NOT NULL DEFAULT false;

-- Recovered statement 5
-- Functie: ken tokens toe aan een bedrijf op basis van plan
CREATE OR REPLACE FUNCTION public.grant_plan_tokens(p_company_id BIGINT, p_plan VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens INTEGER;
  v_existing RECORD;
BEGIN
  -- Haal token limiet op voor dit plan
  SELECT tokens_on_signup INTO v_tokens
  FROM public.plan_ai_token_limits
  WHERE plan = p_plan;

  IF v_tokens IS NULL THEN
    v_tokens := 100; -- fallback
  END IF;

  -- Haal bestaand credit record op
  SELECT * INTO v_existing
  FROM public.company_ai_credits
  WHERE company_id = p_company_id;

  IF v_existing IS NULL THEN
    -- Nieuw record aanmaken
    INSERT INTO public.company_ai_credits (
      company_id, credits_remaining, total_purchased, credits_used,
      low_balance_notified, last_purchase_at
    ) VALUES (
      p_company_id, v_tokens, v_tokens, 0, false, NOW()
    );
  ELSE
    -- Bestaand record updaten (tokens toevoegen bij upgrade)
    UPDATE public.company_ai_credits SET
      credits_remaining = v_tokens,
      total_purchased   = total_purchased + v_tokens,
      low_balance_notified = false,
      last_purchase_at  = NOW(),
      updated_at        = NOW()
    WHERE company_id = p_company_id;
  END IF;

  -- Log de toekenning
  INSERT INTO public.ai_credit_transactions (
    company_id, type, amount,
    credits_before, credits_after,
    description
  ) VALUES (
    p_company_id,
    'bonus',
    v_tokens,
    COALESCE(v_existing.credits_remaining, 0),
    COALESCE(v_existing.credits_remaining, 0) + v_tokens,
    'Automatische tokens voor plan: ' || p_plan
  );
END;
$$;

-- Recovered statement 6
-- Trigger: ken tokens toe wanneer een bedrijf wordt aangemaakt (gratis plan)
CREATE OR REPLACE FUNCTION public.on_company_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.grant_plan_tokens(NEW.id, COALESCE(NEW.plan, 'free'));
  RETURN NEW;
END;
$$;

-- Recovered statement 7
DROP TRIGGER IF EXISTS trigger_company_created_tokens ON public.bedrijven;

-- Recovered statement 8
CREATE TRIGGER trigger_company_created_tokens
  AFTER INSERT ON public.bedrijven
  FOR EACH ROW
  EXECUTE FUNCTION public.on_company_created();

-- Recovered statement 9
-- Trigger: ken tokens toe wanneer plan wordt geüpgraded
CREATE OR REPLACE FUNCTION public.on_plan_upgraded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Alleen uitvoeren als plan daadwerkelijk veranderd is
  IF NEW.plan IS DISTINCT FROM OLD.plan AND NEW.plan != 'free' THEN
    PERFORM public.grant_plan_tokens(NEW.id, NEW.plan);
  END IF;
  RETURN NEW;
END;
$$;

-- Recovered statement 10
DROP TRIGGER IF EXISTS trigger_plan_upgraded_tokens ON public.bedrijven;

-- Recovered statement 11
CREATE TRIGGER trigger_plan_upgraded_tokens
  AFTER UPDATE OF plan ON public.bedrijven
  FOR EACH ROW
  EXECUTE FUNCTION public.on_plan_upgraded();

-- Recovered statement 12
-- Ken tokens toe aan bestaande bedrijven die nog geen credits hebben
INSERT INTO public.company_ai_credits (company_id, credits_remaining, total_purchased, credits_used)
SELECT b.id, 100, 100, 0
FROM public.bedrijven b
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_ai_credits c WHERE c.company_id = b.id
)
ON CONFLICT DO NOTHING;

