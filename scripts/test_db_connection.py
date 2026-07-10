"""Test Supabase Postgres connection. Run from project root with venv active."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg2

from db_config import get_database_url, print_password_help

try:
    database_url = get_database_url()
except SystemExit:
    raise

try:
    connection = psycopg2.connect(database_url)
    with connection.cursor() as cur:
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
    connection.close()
    print("Verbinding OK")
    print(version)
except psycopg2.Error as exc:
    msg = str(exc)
    print(f"Verbinding mislukt: {msg}", file=sys.stderr)
    if "password authentication failed" in msg.lower():
        print(
            "\nWachtwoord klopt niet. Reset via Supabase → Database → Reset database password.",
            file=sys.stderr,
        )
    elif "could not translate host name" in msg.lower():
        print(
            "\nHost niet gevonden. Controleer internet/DNS of gebruik de URI uit Supabase → Connect.",
            file=sys.stderr,
        )
    elif "tenant" in msg.lower():
        print(
            "\nVerkeerde pooler. Gebruik directe verbinding (db.*.supabase.co, user postgres).",
            file=sys.stderr,
        )
    else:
        print_password_help()
    sys.exit(1)
