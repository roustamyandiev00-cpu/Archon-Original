import { NextResponse } from "next/server";
import { API_RESOURCES } from "@/lib/apiResources";

export const dynamic = "force-dynamic";

/** Publieke index: welke endpoints bestaan en hoe je authenticeert. */
export function GET() {
  return NextResponse.json(
    {
      name: "ArchonPro API",
      version: "v1",
      authentication:
        "Stuur je API-sleutel mee via de header 'Authorization: Bearer <sleutel>'.",
      note: "Alle endpoints zijn read-only (GET) en geven enkel data van jouw bedrijf terug.",
      endpoints: API_RESOURCES.map((r) => ({
        resource: r.id,
        path: r.path,
        description: r.description,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
