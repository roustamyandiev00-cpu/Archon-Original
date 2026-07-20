-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260407000000
-- Production name: project_notes
CREATE TABLE IF NOT EXISTS public.project_notes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projecten(id) ON DELETE CASCADE,
  bedrijf_id BIGINT NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type VARCHAR(50) NOT NULL DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recovered statement 2
CREATE INDEX IF NOT EXISTS idx_project_notes_project_created_at
  ON public.project_notes(project_id, created_at DESC);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_project_notes_bedrijf_id
  ON public.project_notes(bedrijf_id);

-- Recovered statement 4
DROP TRIGGER IF EXISTS set_project_notes_updated_at ON public.project_notes;

-- Recovered statement 5
CREATE TRIGGER set_project_notes_updated_at
  BEFORE UPDATE ON public.project_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recovered statement 6
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Recovered statement 7
DROP POLICY IF EXISTS "project_notes_select" ON public.project_notes;

-- Recovered statement 8
CREATE POLICY "project_notes_select" ON public.project_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = project_notes.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 9
DROP POLICY IF EXISTS "project_notes_insert" ON public.project_notes;

-- Recovered statement 10
CREATE POLICY "project_notes_insert" ON public.project_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = project_notes.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Recovered statement 11
DROP POLICY IF EXISTS "project_notes_update" ON public.project_notes;

-- Recovered statement 12
CREATE POLICY "project_notes_update" ON public.project_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = project_notes.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND (
          project_notes.created_by = auth.uid()
          OR cm.role = ANY (ARRAY['owner', 'admin', 'project_manager'])
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = project_notes.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND (
          project_notes.created_by = auth.uid()
          OR cm.role = ANY (ARRAY['owner', 'admin', 'project_manager'])
        )
    )
  );

-- Recovered statement 13
DROP POLICY IF EXISTS "project_notes_delete" ON public.project_notes;

-- Recovered statement 14
CREATE POLICY "project_notes_delete" ON public.project_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = project_notes.bedrijf_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND (
          project_notes.created_by = auth.uid()
          OR cm.role = ANY (ARRAY['owner', 'admin', 'project_manager'])
        )
    )
  );

