import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { searchBouwmateriaalPrijzen, btwDisclaimer } from "@/lib/bouwmaterialen/prijzen";
import { htmlToPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const regio = url.searchParams.get("regio");

  const hits = await searchBouwmateriaalPrijzen(supabase, {
    query: q,
    regio,
  });

  const rows = hits
    .map(
      (h) => `
      <tr>
        <td>${escapeHtml(h.productnaam)}</td>
        <td>${escapeHtml(h.winkelNaam)}</td>
        <td>€${h.prijs.toFixed(2)} / ${escapeHtml(h.eenheid)}</td>
        <td>${escapeHtml(btwDisclaimer(h.btwStatus))}</td>
        <td>${new Date(h.gecontroleerdOp).toLocaleString("nl-BE")}${h.isStale ? " (verouderd)" : ""}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#111}
    h1{font-size:18px} table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #ddd;padding:6px;text-align:left}
    th{background:#f4f4f5} .note{font-size:10px;color:#666;margin-top:12px}
  </style></head><body>
    <h1>Materiaalvoorraad — ${escapeHtml(q)}</h1>
    <p class="note">Gegenereerd ${new Date().toLocaleString("nl-BE")}. Prijzen zonder recente controle zijn gemarkeerd.</p>
    <table>
      <thead><tr><th>Product</th><th>Winkel</th><th>Prijs</th><th>BTW</th><th>Gecontroleerd</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=5>Geen resultaten</td></tr>"}</tbody>
    </table>
  </body></html>`;

  const pdf = await htmlToPdf(html);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="materiaal-${q.slice(0, 40)}.pdf"`,
    },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
