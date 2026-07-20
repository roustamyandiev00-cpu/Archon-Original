-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260410093000
-- Production name: offerte_conversie_en_activities
-- Migration: Offerte Conversie & Activities
-- Voegt conversie koppelingen en activity logging toe aan offertes

-- ============================================================================
-- PART 1: Conversie koppelingen
-- ============================================================================

-- Voeg koppeling naar factuur toe (als die nog niet bestaat)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offertes' AND column_name = 'converted_to_invoice_id'
  ) THEN
    ALTER TABLE offertes ADD COLUMN converted_to_invoice_id BIGINT REFERENCES facturen(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recovered statement 2
-- Voeg koppeling naar project toe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offertes' AND column_name = 'converted_to_project_id'
  ) THEN
    ALTER TABLE offertes ADD COLUMN converted_to_project_id BIGINT REFERENCES projecten(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recovered statement 3
-- Voeg conversie timestamp toe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offertes' AND column_name = 'converted_at'
  ) THEN
    ALTER TABLE offertes ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Recovered statement 4
-- Voeg conversie type toe (invoice/project)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offertes' AND column_name = 'converted_to_type'
  ) THEN
    ALTER TABLE offertes ADD COLUMN converted_to_type VARCHAR(50) 
      CHECK (converted_to_type IN ('invoice', 'project'));
  END IF;
END $$;

-- Recovered statement 5
-- Voeg geconverteerd door toe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offertes' AND column_name = 'converted_by'
  ) THEN
    ALTER TABLE offertes ADD COLUMN converted_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Recovered statement 6
-- Update status_new constraint om 'gefactureerd' en 'geconverteerd_naar_project' toe te voegen
DO $$
BEGIN
  -- Verwijder oude constraint
  ALTER TABLE offertes DROP CONSTRAINT IF EXISTS chk_offerte_status_new;
  
  -- Voeg nieuwe constraint toe met extra statussen
  ALTER TABLE offertes ADD CONSTRAINT chk_offerte_status_new 
    CHECK (status_new IN (
      'concept', 
      'verzonden', 
      'bekeken', 
      'geaccepteerd', 
      'afgewezen', 
      'verlopen',
      'gefactureerd',
      'geconverteerd_naar_project'
    ));
END $$;

-- Recovered statement 7
-- ============================================================================
-- PART 2: Activities / Tijdlijn tabel
-- ============================================================================

CREATE TABLE IF NOT EXISTS offerte_activities (
  id BIGSERIAL PRIMARY KEY,
  offerte_id BIGINT NOT NULL REFERENCES offertes(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  
  -- Type activiteit
  activity_type VARCHAR(100) NOT NULL 
    CHECK (activity_type IN (
      'created',
      'status_changed',
      'sent',
      'viewed',
      'email_opened',
      'converted_to_invoice',
      'converted_to_project',
      'note_added',
      'reminder_sent',
      'pdf_downloaded'
    )),
  
  -- Voor status wijzigingen
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Extra metadata (JSONB voor flexibiliteit)
  metadata JSONB DEFAULT '{}',
  
  -- Wie heeft de actie uitgevoerd
  performed_by UUID REFERENCES auth.users(id),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovered statement 8
-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_offerte_activities_offerte_id ON offerte_activities(offerte_id);

-- Recovered statement 9
CREATE INDEX IF NOT EXISTS idx_offerte_activities_company_id ON offerte_activities(company_id);

-- Recovered statement 10
CREATE INDEX IF NOT EXISTS idx_offerte_activities_created_at ON offerte_activities(created_at DESC);

-- Recovered statement 11
CREATE INDEX IF NOT EXISTS idx_offerte_activities_type ON offerte_activities(activity_type);

-- Recovered statement 12
-- Composite index voor tijdlijn queries
CREATE INDEX IF NOT EXISTS idx_offerte_activities_offerte_created 
  ON offerte_activities(offerte_id, created_at DESC);

-- Recovered statement 13
-- ============================================================================
-- PART 3: RLS Policies voor activities
-- ============================================================================

ALTER TABLE offerte_activities ENABLE ROW LEVEL SECURITY;

-- Recovered statement 14
-- Service role kan alles
CREATE POLICY "Service role full access on offerte_activities" ON offerte_activities
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Recovered statement 15
-- Gebruikers kunnen alleen activities van hun eigen bedrijf zien
CREATE POLICY "Users can view own company activities" ON offerte_activities
  FOR SELECT 
  USING (
    company_id IN (
      SELECT id FROM bedrijven WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 16
-- Gebruikers kunnen activities aanmaken voor hun bedrijf
CREATE POLICY "Users can insert own company activities" ON offerte_activities
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT id FROM bedrijven WHERE user_id = auth.uid()
    )
  );

-- Recovered statement 17
-- ============================================================================
-- PART 4: Helper functie voor activity logging
-- ============================================================================

CREATE OR REPLACE FUNCTION log_offerte_activity(
  p_offerte_id BIGINT,
  p_company_id BIGINT,
  p_activity_type VARCHAR(100),
  p_old_status VARCHAR(50) DEFAULT NULL,
  p_new_status VARCHAR(50) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_performed_by UUID DEFAULT auth.uid()
) RETURNS BIGINT AS $$
DECLARE
  v_activity_id BIGINT;
BEGIN
  INSERT INTO offerte_activities (
    offerte_id,
    company_id,
    activity_type,
    old_status,
    new_status,
    metadata,
    performed_by
  ) VALUES (
    p_offerte_id,
    p_company_id,
    p_activity_type,
    p_old_status,
    p_new_status,
    p_metadata,
    p_performed_by
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recovered statement 18
-- ============================================================================
-- PART 5: Trigger voor automatische activity logging bij status wijziging
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_log_offerte_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log alleen als status daadwerkelijk veranderd is
  IF OLD.status_new IS DISTINCT FROM NEW.status_new THEN
    PERFORM log_offerte_activity(
      NEW.id,
      NEW.bedrijf_id,
      'status_changed',
      OLD.status_new,
      NEW.status_new,
      jsonb_build_object(
        'offerte_nummer', NEW.nummer,
        'timestamp', NOW()
      )
    );
    
    -- Update timestamp velden op basis van nieuwe status
    CASE NEW.status_new
      WHEN 'verzonden' THEN
        NEW.sent_at := COALESCE(NEW.sent_at, NOW());
      WHEN 'bekeken' THEN
        NEW.viewed_at := COALESCE(NEW.viewed_at, NOW());
      WHEN 'geaccepteerd' THEN
        NEW.accepted_at := COALESCE(NEW.accepted_at, NOW());
      WHEN 'afgewezen' THEN
        NEW.rejected_at := COALESCE(NEW.rejected_at, NOW());
      WHEN 'verlopen' THEN
        NEW.expired_at := COALESCE(NEW.expired_at, NOW());
      ELSE
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recovered statement 19
-- Installeer trigger
DROP TRIGGER IF EXISTS trigger_offerte_status_activity ON offertes;

-- Recovered statement 20
CREATE TRIGGER trigger_offerte_status_activity
  BEFORE UPDATE ON offertes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_offerte_status_change();

-- Recovered statement 21
-- ============================================================================
-- PART 6: Comments
-- ============================================================================

COMMENT ON TABLE offerte_activities IS 'Tijdlijn/audit log voor offerte activiteiten en status wijzigingen';

-- Recovered statement 22
COMMENT ON COLUMN offertes.converted_to_invoice_id IS 'Factuur ID waarnaar deze offerte is omgezet';

-- Recovered statement 23
COMMENT ON COLUMN offertes.converted_to_project_id IS 'Project ID waarnaar deze offerte is omgezet';

-- Recovered statement 24
COMMENT ON COLUMN offertes.converted_at IS 'Timestamp van conversie';

-- Recovered statement 25
COMMENT ON COLUMN offertes.converted_to_type IS 'Type conversie: invoice of project';

-- Recovered statement 26
COMMENT ON COLUMN offertes.converted_by IS 'Gebruiker die de conversie heeft uitgevoerd';

-- Recovered statement 27
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Offerte conversie & activities migration completed successfully';
  RAISE NOTICE 'Nieuwe velden: converted_to_invoice_id, converted_to_project_id, converted_at, converted_to_type, converted_by';
  RAISE NOTICE 'Nieuwe tabel: offerte_activities';
  RAISE NOTICE 'Nieuwe statussen: gefactureerd, geconverteerd_naar_project';
END $$;

