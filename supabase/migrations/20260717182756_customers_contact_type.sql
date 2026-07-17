BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.customers
    WHERE NULLIF(BTRIM(company_name), '') IS NULL
  ) THEN
    RAISE EXCEPTION
      'customers_contact_type migration aborted: customer without company_name requires manual classification';
  END IF;
END
$$;

ALTER TABLE public.customers
  ADD COLUMN contact_type text;

UPDATE public.customers
SET contact_type = 'company'
WHERE contact_type IS NULL;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_contact_type_check
  CHECK (contact_type IN ('individual', 'company'));

ALTER TABLE public.customers
  ALTER COLUMN contact_type SET DEFAULT 'company',
  ALTER COLUMN contact_type SET NOT NULL;

COMMENT ON COLUMN public.customers.contact_type IS
  'CRM classification: individual or company.';

CREATE INDEX idx_customers_company_contact_type
  ON public.customers (company_id, contact_type)
  WHERE is_active IS TRUE;

COMMIT;
