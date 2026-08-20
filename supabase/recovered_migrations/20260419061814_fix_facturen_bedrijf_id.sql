-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260419061814
-- Production name: fix_facturen_bedrijf_id
-- Fix: add missing columns to facturen (legacy text-id schema)
-- The existing facturen table uses TEXT ids (e.g. "FAC-003"), not BIGINT

-- 1. Core: bedrijf_id for multi-tenant scoping (FK to bedrijven which uses BIGINT)
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS bedrijf_id BIGINT REFERENCES public.bedrijven(id) ON DELETE RESTRICT;

-- Recovered statement 2
CREATE INDEX IF NOT EXISTS idx_facturen_bedrijf_id ON public.facturen(bedrijf_id);

-- Recovered statement 3
-- 2. Document fields (no FK on offerte_id since offertes uses TEXT id too)
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS offerte_id TEXT;

-- Recovered statement 4
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS customer_id BIGINT;

-- Recovered statement 5
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Recovered statement 6
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS nummer VARCHAR(50);

-- Recovered statement 7
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS bedrag NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Recovered statement 8
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS btw_bedrag NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Recovered statement 9
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS totaal_bedrag NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Recovered statement 10
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS datum DATE NOT NULL DEFAULT CURRENT_DATE;

-- Recovered statement 11
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS vervaldatum DATE;

-- Recovered statement 12
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Recovered statement 13
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Recovered statement 14
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Recovered statement 15
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;

-- Recovered statement 16
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS versie_nummer INTEGER NOT NULL DEFAULT 1;

-- Recovered statement 17
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS omschrijving TEXT;

-- Recovered statement 18
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS notities TEXT;

-- Recovered statement 19
ALTER TABLE public.facturen ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Recovered statement 20
-- 3. Backfill bedrijf_id for existing rows
UPDATE public.facturen 
SET bedrijf_id = (SELECT id FROM public.bedrijven ORDER BY id LIMIT 1) 
WHERE bedrijf_id IS NULL;

-- Recovered statement 21
-- 4. Backfill nummer from existing id field
UPDATE public.facturen SET nummer = id WHERE nummer IS NULL;

-- Recovered statement 22
-- 5. RLS
ALTER TABLE public.facturen ENABLE ROW LEVEL SECURITY;

-- Recovered statement 23
DROP POLICY IF EXISTS "Allow authenticated select on facturen" ON public.facturen;

-- Recovered statement 24
CREATE POLICY "Allow authenticated select on facturen" ON public.facturen
  FOR SELECT USING (auth.role() = 'authenticated');

-- Recovered statement 25
DROP POLICY IF EXISTS "Allow authenticated insert on facturen" ON public.facturen;

-- Recovered statement 26
CREATE POLICY "Allow authenticated insert on facturen" ON public.facturen
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Recovered statement 27
DROP POLICY IF EXISTS "Allow authenticated update on facturen" ON public.facturen;

-- Recovered statement 28
CREATE POLICY "Allow authenticated update on facturen" ON public.facturen
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Recovered statement 29
DROP POLICY IF EXISTS "Allow authenticated delete on facturen" ON public.facturen;

-- Recovered statement 30
CREATE POLICY "Allow authenticated delete on facturen" ON public.facturen
  FOR DELETE USING (auth.role() = 'authenticated');

