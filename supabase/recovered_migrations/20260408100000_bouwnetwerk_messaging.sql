-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260408100000
-- Production name: bouwnetwerk_messaging
-- =====================================================
-- BOUWNETWERK MESSAGING SYSTEM
-- Inter-bedrijf communicatie voor bouwbedrijven
-- =====================================================

-- =====================================================
-- 1. NETWERK CONNECTIES
-- Bedrijven kunnen met elkaar connecteren
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bouwnetwerk_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Bedrijven
  company_a_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_b_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  
  -- Wie heeft de connectie aangevraagd
  requested_by_company_id UUID NOT NULL REFERENCES public.companies(id),
  
  -- Metadata
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  
  -- Notities
  request_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_companies CHECK (company_a_id != company_b_id),
  CONSTRAINT unique_connection UNIQUE (company_a_id, company_b_id)
);

-- Recovered statement 2
-- Index voor snelle lookups
CREATE INDEX idx_bouwnetwerk_connections_company_a ON public.bouwnetwerk_connections(company_a_id);

-- Recovered statement 3
CREATE INDEX idx_bouwnetwerk_connections_company_b ON public.bouwnetwerk_connections(company_b_id);

-- Recovered statement 4
CREATE INDEX idx_bouwnetwerk_connections_status ON public.bouwnetwerk_connections(status);

-- Recovered statement 5
-- =====================================================
-- 2. CHAT KANALEN
-- Groepschats of 1-op-1 chats
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bouwnetwerk_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type kanaal
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'project')),
  
  -- Naam (voor groepschats)
  name TEXT,
  description TEXT,
  
  -- Project koppeling (optioneel)
  project_id UUID REFERENCES public.projecten(id) ON DELETE SET NULL,
  
  -- Aangemaakt door
  created_by_company_id UUID NOT NULL REFERENCES public.companies(id),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  avatar_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  
  -- Laatste activiteit
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recovered statement 6
CREATE INDEX idx_bouwnetwerk_channels_type ON public.bouwnetwerk_channels(type);

-- Recovered statement 7
CREATE INDEX idx_bouwnetwerk_channels_project ON public.bouwnetwerk_channels(project_id);

-- Recovered statement 8
CREATE INDEX idx_bouwnetwerk_channels_created_by ON public.bouwnetwerk_channels(created_by_company_id);

-- Recovered statement 9
CREATE INDEX idx_bouwnetwerk_channels_last_message ON public.bouwnetwerk_channels(last_message_at DESC);

-- Recovered statement 10
-- =====================================================
-- 3. KANAAL LEDEN
-- Welke bedrijven zitten in welk kanaal
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bouwnetwerk_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  channel_id UUID NOT NULL REFERENCES public.bouwnetwerk_channels(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Role in kanaal
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  
  -- Notificatie instellingen
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Laatste gelezen
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  
  -- Join/leave tracking
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_channel_member UNIQUE (channel_id, company_id)
);

-- Recovered statement 11
CREATE INDEX idx_bouwnetwerk_channel_members_channel ON public.bouwnetwerk_channel_members(channel_id);

-- Recovered statement 12
CREATE INDEX idx_bouwnetwerk_channel_members_company ON public.bouwnetwerk_channel_members(company_id);

-- Recovered statement 13
CREATE INDEX idx_bouwnetwerk_channel_members_active ON public.bouwnetwerk_channel_members(channel_id, is_active);

-- Recovered statement 14
-- =====================================================
-- 4. BERICHTEN
-- Daadwerkelijke chat berichten
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bouwnetwerk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  channel_id UUID NOT NULL REFERENCES public.bouwnetwerk_channels(id) ON DELETE CASCADE,
  
  -- Afzender
  sender_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Bericht inhoud
  content TEXT,
  
  -- Type bericht
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  
  -- Metadata voor bestanden/images
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Reply/thread
  reply_to_message_id UUID REFERENCES public.bouwnetwerk_messages(id) ON DELETE SET NULL,
  
  -- Reactions
  reactions JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recovered statement 15
CREATE INDEX idx_bouwnetwerk_messages_channel ON public.bouwnetwerk_messages(channel_id, created_at DESC);

-- Recovered statement 16
CREATE INDEX idx_bouwnetwerk_messages_sender_company ON public.bouwnetwerk_messages(sender_company_id);

-- Recovered statement 17
CREATE INDEX idx_bouwnetwerk_messages_sender_user ON public.bouwnetwerk_messages(sender_user_id);

-- Recovered statement 18
CREATE INDEX idx_bouwnetwerk_messages_reply_to ON public.bouwnetwerk_messages(reply_to_message_id);

-- Recovered statement 19
-- =====================================================
-- 5. BERICHT LEESSTATUSSEN
-- Tracking wie welk bericht heeft gelezen
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bouwnetwerk_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  message_id UUID NOT NULL REFERENCES public.bouwnetwerk_messages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_message_read UNIQUE (message_id, company_id)
);

-- Recovered statement 20
CREATE INDEX idx_bouwnetwerk_message_reads_message ON public.bouwnetwerk_message_reads(message_id);

-- Recovered statement 21
CREATE INDEX idx_bouwnetwerk_message_reads_company ON public.bouwnetwerk_message_reads(company_id);

-- Recovered statement 22
-- =====================================================
-- 6. TYPING INDICATORS
-- Real-time typing indicators
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bouwnetwerk_typing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  channel_id UUID NOT NULL REFERENCES public.bouwnetwerk_channels(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 seconds'),
  
  CONSTRAINT unique_typing UNIQUE (channel_id, company_id, user_id)
);

-- Recovered statement 23
CREATE INDEX idx_bouwnetwerk_typing_channel ON public.bouwnetwerk_typing(channel_id);

-- Recovered statement 24
CREATE INDEX idx_bouwnetwerk_typing_expires ON public.bouwnetwerk_typing(expires_at);

-- Recovered statement 25
-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get or create direct channel tussen twee bedrijven
CREATE OR REPLACE FUNCTION get_or_create_direct_channel(
  p_company_a_id UUID,
  p_company_b_id UUID,
  p_created_by_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_id UUID;
  v_connection_status TEXT;
BEGIN
  -- Check of er een connectie is
  SELECT status INTO v_connection_status
  FROM public.bouwnetwerk_connections
  WHERE (company_a_id = p_company_a_id AND company_b_id = p_company_b_id)
     OR (company_a_id = p_company_b_id AND company_b_id = p_company_a_id)
  LIMIT 1;
  
  -- Als geen connectie of niet accepted, error
  IF v_connection_status IS NULL OR v_connection_status != 'accepted' THEN
    RAISE EXCEPTION 'No accepted connection between companies';
  END IF;
  
  -- Zoek bestaand direct channel
  SELECT c.id INTO v_channel_id
  FROM public.bouwnetwerk_channels c
  INNER JOIN public.bouwnetwerk_channel_members m1 ON c.id = m1.channel_id
  INNER JOIN public.bouwnetwerk_channel_members m2 ON c.id = m2.channel_id
  WHERE c.type = 'direct'
    AND m1.company_id = p_company_a_id
    AND m2.company_id = p_company_b_id
    AND m1.is_active = TRUE
    AND m2.is_active = TRUE
  LIMIT 1;
  
  -- Als niet gevonden, maak nieuw kanaal
  IF v_channel_id IS NULL THEN
    INSERT INTO public.bouwnetwerk_channels (
      type,
      created_by_company_id,
      created_by_user_id
    ) VALUES (
      'direct',
      p_company_a_id,
      p_created_by_user_id
    )
    RETURNING id INTO v_channel_id;
    
    -- Voeg beide bedrijven toe als members
    INSERT INTO public.bouwnetwerk_channel_members (channel_id, company_id)
    VALUES 
      (v_channel_id, p_company_a_id),
      (v_channel_id, p_company_b_id);
  END IF;
  
  RETURN v_channel_id;
END;
$$;

-- Recovered statement 26
-- Function: Get unread message count voor een bedrijf
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_company_id UUID,
  p_channel_id UUID DEFAULT NULL
)
RETURNS TABLE (
  channel_id UUID,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.channel_id,
    COUNT(*)::BIGINT as unread_count
  FROM public.bouwnetwerk_messages m
  INNER JOIN public.bouwnetwerk_channel_members cm 
    ON m.channel_id = cm.channel_id 
    AND cm.company_id = p_company_id
    AND cm.is_active = TRUE
  LEFT JOIN public.bouwnetwerk_message_reads mr 
    ON m.id = mr.message_id 
    AND mr.company_id = p_company_id
  WHERE m.sender_company_id != p_company_id
    AND m.is_deleted = FALSE
    AND mr.id IS NULL
    AND (p_channel_id IS NULL OR m.channel_id = p_channel_id)
    AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
  GROUP BY m.channel_id;
END;
$$;

-- Recovered statement 27
-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.bouwnetwerk_connections ENABLE ROW LEVEL SECURITY;

-- Recovered statement 28
ALTER TABLE public.bouwnetwerk_channels ENABLE ROW LEVEL SECURITY;

-- Recovered statement 29
ALTER TABLE public.bouwnetwerk_channel_members ENABLE ROW LEVEL SECURITY;

-- Recovered statement 30
ALTER TABLE public.bouwnetwerk_messages ENABLE ROW LEVEL SECURITY;

-- Recovered statement 31
ALTER TABLE public.bouwnetwerk_message_reads ENABLE ROW LEVEL SECURITY;

-- Recovered statement 32
ALTER TABLE public.bouwnetwerk_typing ENABLE ROW LEVEL SECURITY;

-- Recovered statement 33
-- Connections: Alleen betrokken bedrijven kunnen zien
CREATE POLICY "Users can view their company connections"
  ON public.bouwnetwerk_connections
  FOR SELECT
  USING (
    company_a_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_b_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Recovered statement 34
CREATE POLICY "Users can create connection requests"
  ON public.bouwnetwerk_connections
  FOR INSERT
  WITH CHECK (
    requested_by_company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Recovered statement 35
CREATE POLICY "Users can update their company connections"
  ON public.bouwnetwerk_connections
  FOR UPDATE
  USING (
    company_a_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_b_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Recovered statement 36
-- Channels: Alleen members kunnen zien
CREATE POLICY "Users can view channels they are member of"
  ON public.bouwnetwerk_channels
  FOR SELECT
  USING (
    id IN (
      SELECT channel_id 
      FROM public.bouwnetwerk_channel_members 
      WHERE company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
        AND is_active = TRUE
    )
  );

-- Recovered statement 37
CREATE POLICY "Users can create channels"
  ON public.bouwnetwerk_channels
  FOR INSERT
  WITH CHECK (
    created_by_company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Recovered statement 38
-- Channel Members: Alleen members van het kanaal kunnen zien
CREATE POLICY "Users can view channel members"
  ON public.bouwnetwerk_channel_members
  FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id 
      FROM public.bouwnetwerk_channel_members 
      WHERE company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
        AND is_active = TRUE
    )
  );

-- Recovered statement 39
-- Messages: Alleen members van het kanaal kunnen zien
CREATE POLICY "Users can view messages in their channels"
  ON public.bouwnetwerk_messages
  FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id 
      FROM public.bouwnetwerk_channel_members 
      WHERE company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
        AND is_active = TRUE
    )
  );

-- Recovered statement 40
CREATE POLICY "Users can send messages in their channels"
  ON public.bouwnetwerk_messages
  FOR INSERT
  WITH CHECK (
    sender_company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    AND channel_id IN (
      SELECT channel_id 
      FROM public.bouwnetwerk_channel_members 
      WHERE company_id = sender_company_id
        AND is_active = TRUE
    )
  );

-- Recovered statement 41
CREATE POLICY "Users can update their own messages"
  ON public.bouwnetwerk_messages
  FOR UPDATE
  USING (sender_user_id = auth.uid());

-- Recovered statement 42
-- Message Reads
CREATE POLICY "Users can view message reads"
  ON public.bouwnetwerk_message_reads
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.bouwnetwerk_messages
      WHERE channel_id IN (
        SELECT channel_id 
        FROM public.bouwnetwerk_channel_members 
        WHERE company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
      )
    )
  );

-- Recovered statement 43
CREATE POLICY "Users can mark messages as read"
  ON public.bouwnetwerk_message_reads
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Recovered statement 44
-- Typing indicators
CREATE POLICY "Users can view typing indicators in their channels"
  ON public.bouwnetwerk_typing
  FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id 
      FROM public.bouwnetwerk_channel_members 
      WHERE company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    )
  );

-- Recovered statement 45
CREATE POLICY "Users can create typing indicators"
  ON public.bouwnetwerk_typing
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Recovered statement 46
CREATE POLICY "Users can delete their typing indicators"
  ON public.bouwnetwerk_typing
  FOR DELETE
  USING (user_id = auth.uid());

-- Recovered statement 47
-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update channel last_message_at bij nieuw bericht
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bouwnetwerk_channels
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.channel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 48
CREATE TRIGGER trigger_update_channel_last_message
  AFTER INSERT ON public.bouwnetwerk_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_last_message();

-- Recovered statement 49
-- Auto-cleanup oude typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing()
RETURNS void AS $$
BEGIN
  DELETE FROM public.bouwnetwerk_typing
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 50
-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.bouwnetwerk_connections IS 'Connecties tussen bouwbedrijven voor inter-bedrijf communicatie';

-- Recovered statement 51
COMMENT ON TABLE public.bouwnetwerk_channels IS 'Chat kanalen (direct, groep, of project-gebonden)';

-- Recovered statement 52
COMMENT ON TABLE public.bouwnetwerk_channel_members IS 'Bedrijven die lid zijn van een chat kanaal';

-- Recovered statement 53
COMMENT ON TABLE public.bouwnetwerk_messages IS 'Chat berichten met support voor tekst, images en bestanden';

-- Recovered statement 54
COMMENT ON TABLE public.bouwnetwerk_message_reads IS 'Tracking van gelezen berichten per bedrijf';

-- Recovered statement 55
COMMENT ON TABLE public.bouwnetwerk_typing IS 'Real-time typing indicators';

