#!/usr/bin/env python3
"""Sync Storecove credentials from .env.local naar integraties.config (bedrijf 10)."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv()

BASE = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/") + "/rest/v1"
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BEDRIJF_ID = os.getenv("PEPPOL_BEDRIJF_ID", "10")

API_KEY = os.getenv("STORECOVE_API_KEY", "").strip()
LEGAL_ENTITY_ID = os.getenv("STORECOVE_LEGAL_ENTITY_ID", "").strip()


def rest(method: str, path: str, body: dict | None = None) -> object:
    data = None
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Accept": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "return=representation"
    req = urllib.request.Request(f"{BASE}/{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"REST {exc.code}: {exc.read().decode()}") from exc


def main() -> None:
    if not KEY:
        print("SUPABASE_SERVICE_ROLE_KEY ontbreekt.", file=sys.stderr)
        sys.exit(1)

    if not API_KEY or not LEGAL_ENTITY_ID:
        print(
            "Vul in .env.local:\n"
            "  STORECOVE_API_KEY=jouw_storecove_api_key\n"
            "  STORECOVE_LEGAL_ENTITY_ID=12345\n",
            file=sys.stderr,
        )
        sys.exit(1)

    rows = rest(
        "GET",
        "integraties?"
        + urllib.parse.urlencode(
            {
                "select": "id,config",
                "bedrijf_id": f"eq.{BEDRIJF_ID}",
                "provider": "eq.peppol",
            }
        ),
    )
    if not rows:
        print(f"Geen peppol-integratie voor bedrijf {BEDRIJF_ID}.", file=sys.stderr)
        sys.exit(1)

    row = rows[0]
    config = dict(row.get("config") or {})
    config.update(
        {
            "accessPoint": "storecove",
            "apiKey": API_KEY,
            "legalEntityId": LEGAL_ENTITY_ID,
            "sandbox": "true",
            "participantId": config.get("participantId") or "0208:0123456789",
        }
    )

    rest(
        "PATCH",
        f"integraties?id=eq.{row['id']}",
        {
            "status": "connected",
            "config": config,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    print("Storecove-config gesynchroniseerd voor bedrijf", BEDRIJF_ID)
    print("  accessPoint: storecove")
    print("  legalEntityId:", LEGAL_ENTITY_ID)
    print("  sandbox: true")
    print("\nTest: Integraties → Peppol → Verbinding testen")
    print("Verstuur: dashboard → facturen/1 → Peppol verzenden")


if __name__ == "__main__":
    main()
