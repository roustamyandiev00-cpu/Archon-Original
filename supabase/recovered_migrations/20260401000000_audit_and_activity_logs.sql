-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260401000000
-- Production name: audit_and_activity_logs
-- Migration: Audit Logs & Activity Logs tabellen
-- Deze tabellen worden gebruikt door /api/audit-logs en /api/activity-logs

-- =====================================================
-- audit_logs: vastlegging van security & admin-acties
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    bigint NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    text NOT NULL,
  event_category text NOT NULL DEFAULT 'general',
  severity      text NOT NULL DEFAULT 'info'
                  CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  target_type   text,
  target_id     uuid,
  metadata      jsonb DEFAULT '{}',
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Recovered statement 2
CREATE INDEX IF NOT EXISTS audit_logs_company_id_idx  ON public.audit_logs (company_id);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx    ON public.audit_logs (actor_id);

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx  ON public.audit_logs (event_type);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS audit_logs_severity_idx    ON public.audit_logs (severity);

-- Recovered statement 6
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx  ON public.audit_logs (created_at DESC);

-- Recovered statement 7
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Recovered statement 8
-- Alleen leesbaar voor leden van hetzelfde bedrijf (schrijven via service-role / admin)
CREATE POLICY "audit_logs: read own company"
  ON public.audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 9
-- =====================================================
-- activity_logs: algemene activiteitsfeed per module
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    bigint NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  module        text NOT NULL,
  action        text NOT NULL,
  target_type   text,
  target_id     uuid,
  description   text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Recovered statement 10
CREATE INDEX IF NOT EXISTS activity_logs_company_id_idx  ON public.activity_logs (company_id);

-- Recovered statement 11
CREATE INDEX IF NOT EXISTS activity_logs_actor_id_idx    ON public.activity_logs (actor_id);

-- Recovered statement 12
CREATE INDEX IF NOT EXISTS activity_logs_module_idx      ON public.activity_logs (module);

-- Recovered statement 13
CREATE INDEX IF NOT EXISTS activity_logs_target_idx      ON public.activity_logs (target_type, target_id);

-- Recovered statement 14
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx  ON public.activity_logs (created_at DESC);

-- Recovered statement 15
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Recovered statement 16
CREATE POLICY "activity_logs: read own company"
  ON public.activity_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

