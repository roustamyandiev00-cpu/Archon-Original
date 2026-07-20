-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260402000000
-- Production name: add_documents_company_id_index
-- Fix expected missing index on documents.company_id
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);

