-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260328170000
-- Production name: performance_indexes
-- Add essential indexes to speed up the application

-- Indexes for frequently queried foreign keys
CREATE INDEX IF NOT EXISTS idx_inkomsten_bedrijf_id ON public.inkomsten(bedrijf_id);

-- Recovered statement 2
CREATE INDEX IF NOT EXISTS idx_inkomsten_klant_id ON public.inkomsten(klant_id);

-- Recovered statement 3
CREATE INDEX IF NOT EXISTS idx_offertes_bedrijf_id ON public.offertes(bedrijf_id);

-- Recovered statement 4
CREATE INDEX IF NOT EXISTS idx_offertes_klant_id ON public.offertes(klant_id);

-- Recovered statement 5
CREATE INDEX IF NOT EXISTS idx_projecten_bedrijf_id ON public.projecten(bedrijf_id);

-- Recovered statement 6
CREATE INDEX IF NOT EXISTS idx_afspraken_bedrijf_id ON public.afspraken(bedrijf_id);

-- Recovered statement 7
CREATE INDEX IF NOT EXISTS idx_tasks_bedrijf_id ON public.tasks(company_id);

-- Recovered statement 8
CREATE INDEX IF NOT EXISTS idx_documents_bedrijf_id ON public.documents(company_id);

-- Recovered statement 9
-- Indexes for status fields that are frequently filtered
CREATE INDEX IF NOT EXISTS idx_inkomsten_status ON public.inkomsten(status);

-- Recovered statement 10
CREATE INDEX IF NOT EXISTS idx_offertes_status ON public.offertes(status);

-- Recovered statement 11
CREATE INDEX IF NOT EXISTS idx_projecten_status ON public.projecten(status);

-- Recovered statement 12
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Recovered statement 13
-- Indexes for sorting by date (latest first is common)
CREATE INDEX IF NOT EXISTS idx_inkomsten_created_at ON public.inkomsten(created_at DESC);

-- Recovered statement 14
CREATE INDEX IF NOT EXISTS idx_offertes_created_at ON public.offertes(created_at DESC);

-- Recovered statement 15
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Recovered statement 16
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

