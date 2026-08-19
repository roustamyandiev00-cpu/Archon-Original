import {
  getPublicOffertePdf,
  isValidPublicOfferteToken,
} from "@/lib/offertes/publicOfferte";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(input: string): string {
  return input.replace(/[^\w.\- ]+/g, "").trim() || "offerte";
}

function errorStatus(reason: "not_found" | "expired" | "invalid"): number {
  if (reason === "expired") return 410;
  return 404;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  if (!isValidPublicOfferteToken(token)) {
    return new Response("Niet gevonden", { status: 404 });
  }

  const result = await getPublicOffertePdf(token);
  if (!result.ok) {
    return new Response(
      result.reason === "expired" ? "Link verlopen" : "Niet gevonden",
      { status: errorStatus(result.reason) },
    );
  }

  const fileName = safeFileName(`Offerte-${result.nummer}`);

  return new Response(new Uint8Array(result.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
