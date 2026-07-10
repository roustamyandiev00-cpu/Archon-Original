-- Migration: Add documents table for proforma and invoices

BEGIN;

CREATE TABLE IF NOT EXISTS documents (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  customer_id bigint NULL,
  reference_number text NULL,
  document_type text NOT NULL CHECK (document_type IN ('proforma','invoice')),
  status text NOT NULL DEFAULT 'draft', -- draft, sent, accepted, paid, cancelled, merged
  source_document_id bigint NULL REFERENCES documents(id) ON DELETE SET NULL,
  merged_into_id bigint NULL REFERENCES documents(id) ON DELETE SET NULL,
  date date DEFAULT CURRENT_DATE,
  due_date date NULL,
  subtotal numeric(12,2) DEFAULT 0,
  tax numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  quarter integer NULL, -- optional: fiscal quarter (1-4)
  period_start date NULL,
  period_end date NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_company_customer ON documents(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(document_type, status);

-- Optional uniqueness: avoid duplicate invoice numbers per company
CREATE UNIQUE INDEX IF NOT EXISTS ux_documents_company_ref ON documents(company_id, reference_number) WHERE reference_number IS NOT NULL;

COMMIT;
