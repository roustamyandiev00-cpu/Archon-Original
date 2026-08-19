-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260331120000
-- Production name: ai_chats_and_messages
-- AI Chats table
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  bigint REFERENCES public.bedrijven(id) ON DELETE SET NULL,
  title       text NOT NULL DEFAULT 'Nieuw gesprek',
  persona     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Recovered statement 2
-- AI Messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    uuid NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recovered statement 3
-- Indexes
CREATE INDEX IF NOT EXISTS ai_chats_user_id_idx ON public.ai_chats(user_id);

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS ai_chats_updated_at_idx ON public.ai_chats(updated_at DESC);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS ai_messages_chat_id_idx ON public.ai_messages(chat_id);

-- Recovered statement 6
-- RLS
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

-- Recovered statement 7
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Recovered statement 8
-- Policies for ai_chats
CREATE POLICY "Users can manage their own chats"
  ON public.ai_chats
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recovered statement 9
-- Policies for ai_messages (via chat ownership)
CREATE POLICY "Users can manage messages in their chats"
  ON public.ai_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chats
      WHERE ai_chats.id = ai_messages.chat_id
        AND ai_chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chats
      WHERE ai_chats.id = ai_messages.chat_id
        AND ai_chats.user_id = auth.uid()
    )
  );

