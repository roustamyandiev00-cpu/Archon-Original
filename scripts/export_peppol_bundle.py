#!/usr/bin/env python3
"""Export Peppol/Storecove bundle voor een factuur via Supabase REST."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv()

BASE = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/") + "/rest/v1"
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

SENSITIVE_KEYS = {"apiKey", "api_key", "peppol_api_key", "encrypted_credentials"}


def redact(obj: Any) -> Any:
    if isinstance(obj, dict):
        out: dict[str, Any] = {}
        for k, v in obj.items():
            if k in SENSITIVE_KEYS and v:
                out[k] = "***REDACTED***"
            else:
                out[k] = redact(v)
        return out
    if isinstance(obj, list):
        return [redact(x) for x in obj]
    return obj


def rest(path: str) -> Any:
    url = f"{BASE}/{path}"
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
            return json.load(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"REST {exc.code}: {body}") from exc


def storecove_checklist(integratie: dict | None, bedrijf: dict | None) -> list[str]:
    tips: list[str] = []
    if not integratie or integratie.get("status") != "connected":
        tips.append("Peppol-integratie is niet connected → Integraties → Peppol verbinden.")
        return tips

    cfg = integratie.get("config") or {}
    ap = cfg.get("accessPoint", "")
    if ap != "storecove":
        tips.append(
            f"accessPoint is '{ap or 'leeg'}' — zet op 'storecove' voor automatisch versturen "
            "(nu: other/handmatig)."
        )
    if not cfg.get("legalEntityId"):
        tips.append("Storecove Legal Entity ID ontbreekt in integraties.config.")
    if not cfg.get("apiKey"):
        tips.append("Storecove API-sleutel ontbreekt in integraties.config.")
    if bedrijf and not bedrijf.get("peppol_participant_id") and not bedrijf.get("btw"):
        tips.append("Bedrijf heeft geen peppol_participant_id of BTW als afzender-ID.")
    if not tips:
        tips.append("Storecove-config ziet er compleet uit — test via Integraties → Verbinding testen.")
    return tips


def main() -> None:
    if not BASE or not KEY:
        print("NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY vereist.", file=sys.stderr)
        sys.exit(1)

    factuur_id = int(sys.argv[1] if len(sys.argv) > 1 else "1")

    facturen = rest(
        "facturen?"
        + urllib.parse.urlencode(
            {
                "select": "*,factuur_lijnen(*)",
                "id": f"eq.{factuur_id}",
            }
        )
    )
    if not facturen:
        print(f"Factuur {factuur_id} niet gevonden.", file=sys.stderr)
        sys.exit(1)

    factuur = facturen[0]
    bedrijf_id = factuur.get("bedrijf_id")
    customer_id = factuur.get("customer_id")

    customer = None
    if customer_id:
        rows = rest(f"customers?select=*&id=eq.{customer_id}")
        customer = rows[0] if rows else None
    factuur["customer"] = customer

    bedrijven = rest(
        f"bedrijven?select=id,naam,btw,kvk,peppol_participant_id,adres,postcode,stad&id=eq.{bedrijf_id}"
    )
    legal = rest(
        f"company_legal_entities?select=*&bedrijf_id=eq.{bedrijf_id}"
    )
    integraties = rest(
        f"integraties?select=*&bedrijf_id=eq.{bedrijf_id}&provider=eq.peppol"
    )
    einvoicing = rest(
        f"company_einvoicing_settings_safe?select=*&bedrijf_id=eq.{bedrijf_id}"
    )
    transmissions = rest(
        f"peppol_transmissions?select=*&factuur_id=eq.{factuur_id}&order=created_at.desc"
    )

    bundle = {
        "factuur_id": factuur_id,
        "factuur": factuur,
        "bedrijf": bedrijven[0] if bedrijven else None,
        "company_legal_entities": legal,
        "integratie_peppol": redact(integraties[0] if integraties else None),
        "einvoicing_settings": einvoicing[0] if einvoicing else None,
        "peppol_transmissions": transmissions,
        "ubl_download_url": f"http://localhost:3000/dashboard/facturen/{factuur_id}/peppol",
        "storecove_checklist": storecove_checklist(
            integraties[0] if integraties else None,
            bedrijven[0] if bedrijven else None,
        ),
    }

    out_dir = ROOT / "exports"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / f"peppol-factuur-{factuur_id}.json"
    out_file.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Export: {out_file}\n")
    print("Factuur:", factuur.get("nummer"), "→", factuur.get("klant"))
    print("Peppol status:", factuur.get("peppol_status"))
    print("Laatste fout:", factuur.get("peppol_last_error") or "—")
    print("\nStorecove checklist:")
    for tip in bundle["storecove_checklist"]:
        print(f"  • {tip}")
    print(f"\nUBL XML (browser, ingelogd): {bundle['ubl_download_url']}")


if __name__ == "__main__":
    main()
