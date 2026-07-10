"""Query Supabase Postgres. Requires DB_PASSWORD or DATABASE_URL in .env.local."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg2

from db_config import get_database_url

QUERY = """
SELECT id, name, company_name, email, city, btw, peppol_participant_id
FROM customers
WHERE is_active = true
ORDER BY name
LIMIT 10;
"""

database_url = get_database_url()

try:
    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cur:
            cur.execute(QUERY)
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]

    print(f"{len(rows)} klanten (max 10):\n")
    for row in rows:
        print(dict(zip(cols, row)))
except psycopg2.Error as exc:
    print(f"Verbinding mislukt: {exc}", file=sys.stderr)
    sys.exit(1)
