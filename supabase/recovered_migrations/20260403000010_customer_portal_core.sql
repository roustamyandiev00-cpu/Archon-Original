-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260403000010
-- Production name: customer_portal_core
-- ============================================================
-- CUSTOMER PORTAL CORE TABLES
-- ============================================================

-- 1. Customers Table (Portal-enabled customers)
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  company_id TEXT NOT NULL, -- UUID-like string from Prisma 'Company'
  
  -- Customer details
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  
  -- Status
  portal_enabled BOOLEAN DEFAULT false,
  portal_invited_at TIMESTAMP WITH TIME ZONE,
  portal_activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 2
-- 2. Customer Portal Users (Link table for Auth)
CREATE TABLE IF NOT EXISTS public.customer_portal_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT portal_users_auth_unique UNIQUE(auth_user_id),
  CONSTRAINT portal_users_customer_unique UNIQUE(customer_id)
);

-- Recovered statement 3
-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS idx_portal_users_customer_id ON public.customer_portal_users(customer_id);

-- Recovered statement 6
CREATE INDEX IF NOT EXISTS idx_portal_users_auth_user_id ON public.customer_portal_users(auth_user_id);

-- Recovered statement 7
-- ============================================================
-- SECURITY: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Recovered statement 8
ALTER TABLE public.customer_portal_users ENABLE ROW LEVEL SECURITY;

-- Recovered statement 9
-- Helper function to check if user is internal (CRM staff)
CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- An internal user is NOT present in the customer_portal_users table
  RETURN NOT EXISTS (
    SELECT 1 FROM public.customer_portal_users 
    WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recovered statement 10
-- ============================================================
-- POLICIES: CUSTOMERS
-- ============================================================

-- 1. Internal users see only customers of their own companies (Prisma managed)
-- Note: This assumes company_id in Supabase matches id in Prisma Company table
CREATE POLICY "Internal users select own customers" ON public.customers
  FOR SELECT 
  USING (
    public.is_internal_user()
  );

-- Recovered statement 11
-- 2. Portal users see only their own customer record
CREATE POLICY "Portal users select own customer record" ON public.customers
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_users 
      WHERE auth_user_id = auth.uid() 
      AND customer_id = public.customers.id
    )
  );

-- Recovered statement 12
-- ============================================================
-- POLICIES: CUSTOMER PORTAL USERS
-- ============================================================

CREATE POLICY "Users see their own portal record" ON public.customer_portal_users
  FOR SELECT 
  USING (auth_user_id = auth.uid() OR public.is_internal_user());

-- Recovered statement 13
-- ============================================================
-- TRIGGERS: TIMESTAMP UPDATES
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 14
CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Recovered statement 15
CREATE TRIGGER set_portal_users_updated_at
  BEFORE UPDATE ON public.customer_portal_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

