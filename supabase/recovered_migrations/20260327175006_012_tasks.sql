-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327175006
-- Production name: 012_tasks
-- Taken/Tasks migration voor ArchonPro
-- Fase 5: Agenda, taken en opvolging

-- Taken tabel
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  -- Taak details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Koppelingen
  project_id BIGINT REFERENCES projecten(id) ON DELETE SET NULL,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  related_entity_type VARCHAR(50) 
    CHECK (related_entity_type IN ('offerte', 'factuur', 'project', 'customer')),
  related_entity_id BIGINT,
  
  -- Toewijzing en planning
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related_entity ON tasks(related_entity_type, related_entity_id);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Interne gebruikers: alleen eigen bedrijf
CREATE POLICY "Tasks - interne gebruikers" ON tasks
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM bedrijven WHERE user_id = auth.uid()
    )
  );

-- Portal gebruikers: alleen taken gekoppeld aan hun projecten
CREATE POLICY "Tasks - portal users" ON tasks
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projecten p
      JOIN customers c ON p.bedrijf_id = c.company_id
      JOIN customer_portal_users cpu ON c.id = cpu.customer_id
      WHERE cpu.auth_user_id = auth.uid() AND cpu.is_active = true
    )
  );

-- Automatische updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Afspraken/Agenda uitbreiding
ALTER TABLE afspraken ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE afspraken ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planned'
  CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled'));
ALTER TABLE afspraken ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'meeting'
  CHECK (type IN ('meeting', 'call', 'site_visit', 'reminder', 'other'));

