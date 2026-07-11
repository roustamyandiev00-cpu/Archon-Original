-- Event-driven autonomous admin agents: domain events + agent runs
-- Non-destructive: new tables only

CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE,
  event_type text NOT NULL,
  tenant_id bigint NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id bigint NOT NULL,
  actor_type text NOT NULL DEFAULT 'system',
  actor_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NOT NULL,
  causation_id uuid,
  origin_agent_id text,
  payload_version int NOT NULL DEFAULT 1,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS domain_events_tenant_idempotency_idx
  ON domain_events (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS domain_events_unprocessed_idx
  ON domain_events (tenant_id, created_at)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS domain_events_entity_idx
  ON domain_events (tenant_id, entity_type, entity_id, event_type);

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id bigint NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  event_id uuid REFERENCES domain_events(id) ON DELETE SET NULL,
  correlation_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'detected',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  input_ref jsonb,
  output_ref jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_runs_correlation_idx
  ON agent_runs (tenant_id, correlation_id);

CREATE INDEX IF NOT EXISTS agent_runs_event_idx
  ON agent_runs (event_id);

ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY domain_events_tenant_select ON domain_events
  FOR SELECT USING (is_member_of_company(tenant_id));

CREATE POLICY domain_events_tenant_insert ON domain_events
  FOR INSERT WITH CHECK (is_member_of_company(tenant_id));

CREATE POLICY domain_events_tenant_update ON domain_events
  FOR UPDATE USING (is_member_of_company(tenant_id));

CREATE POLICY agent_runs_tenant_select ON agent_runs
  FOR SELECT USING (is_member_of_company(tenant_id));

CREATE POLICY agent_runs_tenant_insert ON agent_runs
  FOR INSERT WITH CHECK (is_member_of_company(tenant_id));

CREATE POLICY agent_runs_tenant_update ON agent_runs
  FOR UPDATE USING (is_member_of_company(tenant_id));
