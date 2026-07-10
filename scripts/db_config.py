"""Shared Supabase Postgres connection helpers for local Python scripts."""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

PLACEHOLDER = "JOUW_DB_WACHTWOORD"
DEFAULT_HOST = "db.vqiyftyqfpfbpwhadpvn.supabase.co"


def load_env() -> None:
    load_dotenv(".env.local")
    load_dotenv()


def get_database_url() -> str:
    load_env()

    url = os.getenv("DATABASE_URL", "").strip()
    password = os.getenv("DB_PASSWORD", "").strip()

    if url and PLACEHOLDER not in url:
        return url

    if not password or password == PLACEHOLDER:
        print_password_help()
        sys.exit(1)

    host = os.getenv("DB_HOST", DEFAULT_HOST)
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "postgres")
    user = os.getenv("DB_USER", "postgres")

    return f"postgresql://{user}:{password}@{host}:{port}/{name}?sslmode=require"


def print_password_help() -> None:
    print(
        "Database-wachtwoord ontbreekt in .env.local.\n\n"
        "1. Open Supabase Dashboard → Project Settings → Database\n"
        "2. Kopieer of reset je Database password\n"
        "3. Voeg toe aan .env.local (kies één optie):\n\n"
        "   DB_PASSWORD=jouw_echte_wachtwoord\n\n"
        "   of vervang JOUW_DB_WACHTWOORD in DATABASE_URL\n\n"
        "Gebruik DB_PASSWORD als je speciale tekens in het wachtwoord hebt (@, #, …).",
        file=sys.stderr,
    )
