-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260501164206
-- Production name: drop_old_generate_document_number

DROP FUNCTION IF EXISTS generate_document_number(bigint, text, text);

