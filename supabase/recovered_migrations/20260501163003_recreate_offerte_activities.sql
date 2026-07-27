-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260501163003
-- Production name: recreate_offerte_activities

CREATE TABLE offerte_activities (
  id            BIGSERIAL PRIMARY KEY,
  offerte_id    BIGINT NOT NULL REFERENCES offertes(id) ON DELETE CASCADE,
  company_id    BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created','status_changed','sent','viewed','email_opened',
    'converted_to_invoice','converted_to_project','note_added',
    'reminder_sent','pdf_downloaded'
  )),
  old_status   TEXT,
  new_status   TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  performed_by UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX offerte_activities_offerte_idx       ON offerte_activities(offerte_id);
CREATE INDEX offerte_activities_company_idx       ON offerte_activities(company_id);
CREATE INDEX offerte_activities_created_at_idx    ON offerte_activities(created_at);
CREATE INDEX offerte_activities_type_idx          ON offerte_activities(activity_type);
CREATE INDEX offerte_activities_offerte_created_idx ON offerte_activities(offerte_id, created_at);

ALTER TABLE offerte_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offerte_activities_company_access" ON offerte_activities
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );

-- Auto-log status changes
CREATE OR REPLACE FUNCTION offerte_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status_new IS DISTINCT FROM OLD.status_new) THEN
    INSERT INTO offerte_activities (
      offerte_id, company_id, activity_type, old_status, new_status, performed_by
    ) VALUES (
      NEW.id, NEW.bedrijf_id, 'status_changed', OLD.status_new, NEW.status_new, NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offerte_status_change_log
  AFTER UPDATE ON offertes
  FOR EACH ROW EXECUTE FUNCTION offerte_log_status_change();

