-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260328160000
-- Production name: secure_document_numbering
-- Secure Document Numbering System
-- Prevents duplicate invoice/quote numbers across concurrent requests using ROW EXCLUSIVE locks.

-- 1. Create a sequences table to track document numbering per company and year
CREATE TABLE IF NOT EXISTS public.document_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'quote', 'credit_note')),
    year INTEGER NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    prefix TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, document_type, year)
);

-- Recovered statement 2
-- Enable RLS on document sequences
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

-- Recovered statement 3
-- Only company members can view their sequences
CREATE POLICY "Company members can view document sequences" ON public.document_sequences
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = document_sequences.company_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
    );

-- Recovered statement 4
-- 2. Create the PL/pgSQL function to securely generate the next number
CREATE OR REPLACE FUNCTION public.generate_document_number(
    p_company_id UUID,
    p_document_type TEXT,
    p_prefix TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to ensure the lock works regardless of RLS
AS $$
DECLARE
    v_year INTEGER;
    v_next_val INTEGER;
    v_prefix TEXT;
    v_result TEXT;
BEGIN
    v_year := extract(year from current_date);
    
    -- Set default prefixes if not provided
    IF p_prefix IS NULL THEN
        IF p_document_type = 'invoice' THEN v_prefix := 'INV-';
        ELSIF p_document_type = 'quote' THEN v_prefix := 'OFF-';
        ELSIF p_document_type = 'credit_note' THEN v_prefix := 'CN-';
        ELSE v_prefix := 'DOC-';
        END IF;
    ELSE
        v_prefix := p_prefix;
    END IF;

    -- Upsert and lock the row to prevent race conditions
    -- Note: using INSERT ... ON CONFLICT allows us to initialize if not exists
    INSERT INTO public.document_sequences (company_id, document_type, year, current_value, prefix)
    VALUES (p_company_id, p_document_type, v_year, 0, v_prefix)
    ON CONFLICT (company_id, document_type, year) DO NOTHING;

    -- Lock the row for update. This ensures concurrent requests queue up here.
    UPDATE public.document_sequences
    SET 
        current_value = current_value + 1,
        updated_at = now()
    WHERE company_id = p_company_id 
      AND document_type = p_document_type 
      AND year = v_year
    RETURNING current_value, prefix INTO v_next_val, v_prefix;

    -- Format the number: e.g. INV-2026-0001
    v_result := v_prefix || v_year || '-' || LPAD(v_next_val::TEXT, 4, '0');
    
    RETURN v_result;
END;
$$;

-- Recovered statement 5
-- Note: Invoices table uniqueness is handled in a separate step or already exists via DB definitions;

