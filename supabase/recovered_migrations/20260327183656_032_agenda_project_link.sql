-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260327183656
-- Production name: 032_agenda_project_link
-- Add project_id to afspraken for project-linked appointments
ALTER TABLE afspraken 
ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projecten(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_afspraken_project_id ON afspraken(project_id);

-- Add type constraint if not exists (check valid appointment types)
ALTER TABLE afspraken 
DROP CONSTRAINT IF EXISTS afspraken_type_check;

ALTER TABLE afspraken 
ADD CONSTRAINT afspraken_type_check 
CHECK (type IN ('meeting', 'call', 'site_visit', 'internal', 'other'));

