"""Query customers via Supabase REST API (geen DB_PASSWORD nodig)."""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env.local")
load_dotenv()

BASE = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
# Anon key: alleen data waar RLS toegang geeft (vaak leeg zonder login).
# Service role: server-side, bypass RLS — alleen lokaal/scripts, nooit in browser.
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not BASE or not KEY:
    print(
        "NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY moeten in .env.local staan.",
        file=sys.stderr,
    )
    sys.exit(1)

params = urllib.parse.urlencode(
    {
        "select": "id,name,company_name,email,city,btw,peppol_participant_id",
        "is_active": "eq.true",
        "order": "name.asc",
        "limit": "10",
    }
)
url = f"{BASE}/rest/v1/customers?{params}"

req = urllib.request.Request(
    url,
    headers={
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Accept": "application/json",
    },
)

try:
    with urllib.request.urlopen(req) as resp:
        rows = json.load(resp)
except urllib.error.HTTPError as exc:
    body = exc.read().decode("utf-8", errors="replace")
    print(f"REST API fout ({exc.code}): {body}", file=sys.stderr)
    sys.exit(1)

print(f"{len(rows)} klanten (max 10):\n")
for row in rows:
    print(row)
