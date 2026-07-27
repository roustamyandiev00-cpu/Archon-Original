-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260331130000
-- Production name: ai_knowledge_base
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  bigint NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('instruction', 'document', 'product', 'pricing', 'faq')),
  title       text NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Recovered statement 2
CREATE INDEX IF NOT EXISTS ai_knowledge_base_company_id_idx ON public.ai_knowledge_base(company_id);

-- Recovered statement 3
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Recovered statement 4
CREATE POLICY "Company members can manage knowledge base"
  ON public.ai_knowledge_base
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bedrijven
      WHERE bedrijven.id = ai_knowledge_base.company_id
        AND bedrijven.user_id = auth.uid()
    )
    OR auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bedrijven
      WHERE bedrijven.id = ai_knowledge_base.company_id
        AND bedrijven.user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

