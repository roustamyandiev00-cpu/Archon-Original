-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260508012421
-- Production name: create_agent_tables_company_scoped

-- ============================================================
-- Agent tables met company_id scoping (BIGINT → bedrijven)
-- + RLS policies + updated_at triggers
-- ============================================================

-- Stap 1: Drop bestaande tabellen als ze bestaan
DROP TABLE IF EXISTS agent_permissions CASCADE;
DROP TABLE IF EXISTS agent_activity_logs CASCADE;
DROP TABLE IF EXISTS agent_actions CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;

-- Stap 2: Maak tabellen met correcte company_id scoping

-- Agent Tasks: Taken die agents aanmaken of ontvangen
CREATE TABLE agent_tasks (
  id                   BIGSERIAL PRIMARY KEY,
  company_id           BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  created_by_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_agent       VARCHAR(50) NOT NULL,
  requested_by_agent   VARCHAR(50),

  type                 VARCHAR(50) NOT NULL,
  status               VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority             VARCHAR(20) NOT NULL DEFAULT 'medium',
  title                VARCHAR(255) NOT NULL,
  description          TEXT,

  input_json           JSONB,
  result_json          JSONB,
  requires_approval    BOOLEAN NOT NULL DEFAULT false,
  approved_by_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  target_entity_type   VARCHAR(50),
  target_entity_id     BIGINT,
  target_route         VARCHAR(255),
  error_message        TEXT,

  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Agent Actions: Concrete voorstellen die in AI Inbox verschijnen
CREATE TABLE agent_actions (
  id                   BIGSERIAL PRIMARY KEY,
  company_id           BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  agent_task_id        BIGINT REFERENCES agent_tasks(id) ON DELETE SET NULL,
  agent_name           VARCHAR(50) NOT NULL,
  action_type          VARCHAR(50) NOT NULL,
  status               VARCHAR(50) NOT NULL DEFAULT 'pending',

  title                VARCHAR(255) NOT NULL,
  reason               TEXT,
  confidence           NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  payload_json         JSONB,

  target_entity_type   VARCHAR(50),
  target_entity_id     BIGINT,
  target_route         VARCHAR(255),
  requires_approval    BOOLEAN NOT NULL DEFAULT true,

  approved_at          TIMESTAMP WITH TIME ZONE,
  approved_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at          TIMESTAMP WITH TIME ZONE,
  rejected_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  executed_at          TIMESTAMP WITH TIME ZONE,

  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Agent Activity Logs: Audit trail van alle agent activiteit
CREATE TABLE agent_activity_logs (
  id                   BIGSERIAL PRIMARY KEY,
  company_id           BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  agent_name           VARCHAR(50) NOT NULL,
  action_type          VARCHAR(50) NOT NULL,
  message              TEXT NOT NULL,

  input_json           JSONB,
  output_json          JSONB,
  error_message        TEXT,
  created_by_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Agent Permissions: Wat elke agent mag doen per bedrijf
CREATE TABLE agent_permissions (
  id                   BIGSERIAL PRIMARY KEY,
  company_id           BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  agent_name           VARCHAR(50) NOT NULL,
  permission_key       VARCHAR(100) NOT NULL,
  enabled              BOOLEAN NOT NULL DEFAULT true,

  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, agent_name, permission_key)
);

-- Stap 3: Indexes
CREATE INDEX idx_agent_tasks_company    ON agent_tasks(company_id);
CREATE INDEX idx_agent_tasks_agent      ON agent_tasks(assigned_agent);
CREATE INDEX idx_agent_tasks_status     ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_created    ON agent_tasks(created_at DESC);

CREATE INDEX idx_agent_actions_company  ON agent_actions(company_id);
CREATE INDEX idx_agent_actions_task     ON agent_actions(agent_task_id);
CREATE INDEX idx_agent_actions_status   ON agent_actions(status);
CREATE INDEX idx_agent_actions_agent    ON agent_actions(agent_name);
CREATE INDEX idx_agent_actions_created  ON agent_actions(created_at DESC);

CREATE INDEX idx_agent_logs_company     ON agent_activity_logs(company_id);
CREATE INDEX idx_agent_logs_agent       ON agent_activity_logs(agent_name);
CREATE INDEX idx_agent_logs_created     ON agent_activity_logs(created_at DESC);

CREATE INDEX idx_agent_perms_company    ON agent_permissions(company_id, agent_name);

-- Stap 4: updated_at triggers
CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER agent_actions_updated_at
  BEFORE UPDATE ON agent_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER agent_permissions_updated_at
  BEFORE UPDATE ON agent_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stap 5: Row Level Security
ALTER TABLE agent_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_permissions   ENABLE ROW LEVEL SECURITY;

-- agent_tasks policies
CREATE POLICY "agent_tasks_select" ON agent_tasks
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_tasks_insert" ON agent_tasks
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_tasks_update" ON agent_tasks
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_tasks_delete" ON agent_tasks
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );

-- agent_actions policies
CREATE POLICY "agent_actions_select" ON agent_actions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_actions_insert" ON agent_actions
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_actions_update" ON agent_actions
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_actions_delete" ON agent_actions
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );

-- agent_activity_logs policies
CREATE POLICY "agent_logs_select" ON agent_activity_logs
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_logs_insert" ON agent_activity_logs
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );

-- agent_permissions policies
CREATE POLICY "agent_permissions_select" ON agent_permissions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_permissions_insert" ON agent_permissions
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "agent_permissions_update" ON agent_permissions
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM company_memberships WHERE user_id = auth.uid())
  );

-- Stap 6: Comments
COMMENT ON TABLE agent_tasks         IS 'Taken die AI agents aanmaken of ontvangen — company scoped';
COMMENT ON TABLE agent_actions       IS 'Voorgestelde AI acties die goedkeuring vereisen — AI Inbox feed';
COMMENT ON TABLE agent_activity_logs IS 'Audit trail van alle agent activiteit — company scoped';
COMMENT ON TABLE agent_permissions   IS 'Configuratie van agent toestemmingen per bedrijf';

