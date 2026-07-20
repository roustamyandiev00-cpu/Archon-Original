-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410120000
-- Production name: agenda_taken_uitbreiding
-- Migration: Agenda en Taken Uitbreiding
-- Fase 5: Agenda, taken en opvolging

-- ============================================================================
-- AANPASSINGEN AAN BESTAANDE AFSPRAKEN TABEL
-- ============================================================================

-- Voeg nieuwe kolommen toe aan afspraken tabel
ALTER TABLE afspraken 
  ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES bedrijven(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN (
    'meeting', 'werfbezoek', 'bellen', 'deadline', 'intern', 'overig'
  )),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'completed', 'cancelled', 'no_show'
  )),
  ADD COLUMN IF NOT EXISTS is_werfbezoek BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projecten(id),
  ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;

-- Recovered statement 2
-- Hernoem kolommen naar consistente namen (Engels)
-- Let op: dit is optioneel afhankelijk van of we backward compatibility willen
-- ALTER TABLE afspraken RENAME COLUMN titel TO title;
-- ALTER TABLE afspraken RENAME COLUMN beschrijving TO description;
-- ALTER TABLE afspraken RENAME COLUMN start_tijd TO start_time;
-- ALTER TABLE afspraken RENAME COLUMN eind_tijd TO end_time;
-- ALTER TABLE afspraken RENAME COLUMN locatie TO location;

-- Indexen voor afspraken
CREATE INDEX IF NOT EXISTS idx_afspraken_company ON afspraken(company_id);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_afspraken_start_time ON afsp spraken(start_tijd);

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS idx_afspraken_status ON afspraken(status);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS idx_afspraken_assigned ON afspraken(assigned_to);

-- Recovered statement 6
CREATE INDEX IF NOT EXISTS idx_afspraken_customer ON afspraken(customer_id);

-- Recovered statement 7
CREATE INDEX IF NOT EXISTS idx_afspraken_project ON afspraken(project_id);

-- Recovered statement 8
-- ============================================================================
-- NIEUWE TAKEN TABEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS taken (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  -- Basis info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status workflow
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN (
    'todo', 'gepland', 'bezig', 'review', 'afgerond', 'geannuleerd'
  )),
  
  -- Prioriteit
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN (
    'laag', 'medium', 'hoog', 'kritiek'
  )),
  
  -- Tijd
  deadline TIMESTAMP,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  
  -- Koppelingen
  project_id BIGINT REFERENCES projecten(id) ON DELETE SET NULL,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  offerte_id BIGINT REFERENCES offertes(id) ON DELETE SET NULL,
  factuur_id BIGINT REFERENCES facturen(id) ON DELETE SET NULL,
  
  -- Toewijzing
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Opvolging
  reminder_date TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES auth.users(id)
);

-- Recovered statement 9
-- Indexen voor taken
CREATE INDEX IF NOT EXISTS idx_taken_company ON taken(company_id);

-- Recovered statement 10
CREATE INDEX IF NOT EXISTS idx_taken_status ON taken(status);

-- Recovered statement 11
CREATE INDEX IF NOT EXISTS idx_taken_assigned ON taken(assigned_to);

-- Recovered statement 12
CREATE INDEX IF NOT EXISTS idx_taken_project ON taken(project_id);

-- Recovered statement 13
CREATE INDEX IF NOT EXISTS idx_taken_deadline ON taken(deadline);

-- Recovered statement 14
CREATE INDEX IF NOT EXISTS idx_taken_priority ON taken(priority);

-- Recovered statement 15
-- Trigger voor updated_at
CREATE OR REPLACE FUNCTION update_taken_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 16
DROP TRIGGER IF EXISTS update_taken_updated_at ON taken;

-- Recovered statement 17
CREATE TRIGGER update_taken_updated_at
  BEFORE UPDATE ON taken
  FOR EACH ROW
  EXECUTE FUNCTION update_taken_updated_at();

-- Recovered statement 18
-- ============================================================================
-- RLS POLICIES VOOR TAKEN
-- ============================================================================

ALTER TABLE taken ENABLE ROW LEVEL SECURITY;

-- Recovered statement 19
-- Select: eigen bedrijf + assigned of created
CREATE POLICY "taken_select_own_company" ON taken
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 20
-- Insert: eigen bedrijf
CREATE POLICY "taken_insert_own_company" ON taken
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 21
-- Update: eigen bedrijf (assigned, creator, admin, owner)
CREATE POLICY "taken_update_own" ON taken
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Recovered statement 22
-- Delete: admin of owner
CREATE POLICY "taken_delete_admin" ON taken
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
      AND role IN ('owner', 'admin')
    )
  );

-- Recovered statement 23
-- ============================================================================
-- HELPER FUNCTIES
-- ============================================================================

-- Functie om taak af te ronden
CREATE OR REPLACE FUNCTION complete_task(p_task_id BIGINT, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE taken 
  SET status = 'afgerond', 
      completed_at = NOW(), 
      completed_by = p_user_id,
      updated_at = NOW()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recovered statement 24
-- Functie om taken op te halen per gebruiker
CREATE OR REPLACE FUNCTION get_my_tasks(p_user_id UUID, p_company_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  title VARCHAR,
  status VARCHAR,
  priority VARCHAR,
  deadline TIMESTAMP,
  project_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.status, t.priority, t.deadline, p.naam as project_name
  FROM taken t
  LEFT JOIN projecten p ON t.project_id = p.id
  WHERE t.company_id = p_company_id
    AND (t.assigned_to = p_user_id OR t.created_by = p_user_id)
    AND t.status NOT IN ('afgerond', 'geannuleerd')
  ORDER BY t.deadline ASC NULLS LAST, t.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

