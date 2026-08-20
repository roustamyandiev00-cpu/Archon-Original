-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260402000001
-- Production name: add_ai_credit_tables
-- Add AI credits tracking for companies to support Stripe purchases.
-- These tables are required for the Stripe webhook to function correctly.

-- 1. AI Credits status per company
CREATE TABLE IF NOT EXISTS public.company_ai_credits (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL UNIQUE REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  last_usage_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 2
-- 2. AI Credit transaction log
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id BIGINT NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 3
-- Enable RLS
ALTER TABLE public.company_ai_credits ENABLE ROW LEVEL SECURITY;

-- Recovered statement 4
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Recovered statement 5
-- RLS Policies
CREATE POLICY "Internal users view own company credits" ON public.company_ai_credits
  FOR SELECT USING (company_id = (SELECT get_user_company_id()));

-- Recovered statement 6
CREATE POLICY "Internal users view own credit transactions" ON public.ai_credit_transactions
  FOR SELECT USING (company_id = (SELECT get_user_company_id()));

-- Recovered statement 7
-- Trigger for updated_at
CREATE TRIGGER update_company_ai_credits_updated_at
  BEFORE UPDATE ON public.company_ai_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recovered statement 8
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_credits_company_id ON public.company_ai_credits(company_id);

-- Recovered statement 9
CREATE INDEX IF NOT EXISTS idx_ai_transactions_company_id ON public.ai_credit_transactions(company_id);

-- Recovered statement 10
CREATE INDEX IF NOT EXISTS idx_ai_transactions_created_at ON public.ai_credit_transactions(created_at);

