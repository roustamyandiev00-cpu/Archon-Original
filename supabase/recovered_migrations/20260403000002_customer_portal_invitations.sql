-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260403000002
-- Production name: customer_portal_invitations
-- ============================================================
-- CUSTOMER PORTAL INVITATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_portal_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 2
-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.customer_portal_invitations(token);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_invitations_customer_id ON public.customer_portal_invitations(customer_id);

-- Recovered statement 4
-- RLS for invitations
ALTER TABLE public.customer_portal_invitations ENABLE ROW LEVEL SECURITY;

-- Recovered statement 5
-- Internal users can manage invitations
CREATE POLICY "Internal users manage invitations" ON public.customer_portal_invitations
  FOR ALL USING (public.is_internal_user());

-- Recovered statement 6
-- No direct access for portal users to invitations table;

