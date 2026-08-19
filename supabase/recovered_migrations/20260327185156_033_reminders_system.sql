-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327185156
-- Production name: 033_reminders_system
-- Reminders table for appointment and task notifications
CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link to entity (afspraak or task)
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('afspraak', 'task')),
  entity_id BIGINT NOT NULL,
  
  -- Reminder details
  title TEXT NOT NULL,
  message TEXT,
  reminder_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Notification channels
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_company_id ON reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_at ON reminders(reminder_at) WHERE is_sent = false;
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(user_id, reminder_at) WHERE is_sent = false;

-- RLS policies
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminders
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (user_id = auth.uid());

-- Users can create reminders for themselves
CREATE POLICY "Users can create own reminders" ON reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update/delete their own reminders
CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reminders_updated_at ON reminders;
CREATE TRIGGER trigger_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_updated_at();

-- View for pending reminders (useful for edge function)
CREATE OR REPLACE VIEW pending_reminders AS
SELECT 
  r.*,
  u.email as user_email,
  p.email as profile_email,
  p.full_name as user_full_name
FROM reminders r
JOIN auth.users u ON r.user_id = u.id
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.is_sent = false 
AND r.reminder_at <= NOW() + INTERVAL '5 minutes'
AND r.email_enabled = true;

