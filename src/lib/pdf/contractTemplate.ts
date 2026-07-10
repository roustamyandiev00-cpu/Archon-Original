import type { SamenwerkingContractDraft } from "@/lib/agents/contract";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\n/g, "<br />");
}

export type ContractSignatureBlock = {
  companyName: string;
  signerName: string;
  signedAt: string;
};

export function buildContractHtml(input: {
  draft: SamenwerkingContractDraft;
  partyAName: string;
  partyBName: string;
  partyASignature?: ContractSignatureBlock | null;
  partyBSignature?: ContractSignatureBlock | null;
  generatedAt?: string;
}): string {
  const generatedAt =
    input.generatedAt ??
    new Date().toLocaleDateString("nl-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const sections = input.draft.sections
    .map(
      (s) => `
      <section class="section">
        <h2>${escapeHtml(s.heading)}</h2>
        <p>${bodyToHtml(s.body)}</p>
      </section>`,
    )
    .join("");

  const signatureCell = (
    label: string,
    company: string,
    sig?: ContractSignatureBlock | null,
  ) => {
    if (sig) {
      return `
        <div class="sig-cell signed">
          <p class="sig-label">${escapeHtml(label)}</p>
          <p class="sig-company">${escapeHtml(company)}</p>
          <p class="sig-name">${escapeHtml(sig.signerName)}</p>
          <p class="sig-meta">Digitaal ondertekend op ${escapeHtml(sig.signedAt)}</p>
        </div>`;
    }
    return `
      <div class="sig-cell">
        <p class="sig-label">${escapeHtml(label)}</p>
        <p class="sig-company">${escapeHtml(company)}</p>
        <div class="sig-line"></div>
        <p class="sig-meta">Handtekening &amp; datum</p>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.draft.titel)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #18181b;
      margin: 0;
      padding: 48px;
      line-height: 1.55;
      font-size: 13px;
    }
    header {
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px;
      color: #0f172a;
    }
    .meta {
      color: #64748b;
      font-size: 12px;
    }
    .section { margin-bottom: 22px; }
    .section h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #0369a1;
      margin: 0 0 8px;
    }
    .section p { margin: 0; color: #334155; }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .sig-cell {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      min-height: 120px;
    }
    .sig-cell.signed {
      border-color: #86efac;
      background: #f0fdf4;
    }
    .sig-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin: 0 0 6px;
    }
    .sig-company {
      font-weight: 600;
      margin: 0 0 12px;
      color: #0f172a;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      height: 36px;
      margin-bottom: 8px;
    }
    .sig-name {
      font-weight: 600;
      margin: 0 0 4px;
      color: #166534;
    }
    .sig-meta {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    footer {
      margin-top: 32px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(input.draft.titel)}</h1>
    <p class="meta">Opgesteld via ArchonPro Bouwnetwerk · ${escapeHtml(generatedAt)}</p>
    ${
      input.draft.tarief
        ? `<p class="meta">Tarief: ${escapeHtml(input.draft.tarief)}</p>`
        : ""
    }
  </header>
  ${sections}
  <div class="signatures">
    ${signatureCell("Partij A — Opdrachtgever", input.partyAName, input.partyASignature)}
    ${signatureCell("Partij B — Partner", input.partyBName, input.partyBSignature)}
  </div>
  <footer>
    Dit document is digitaal opgesteld. Ondertekening via ArchonPro geldt als akkoord tussen beide partijen.
  </footer>
</body>
</html>`;
}

export function draftToStoredHtml(input: {
  draft: SamenwerkingContractDraft;
  partyAName: string;
  partyBName: string;
}): string {
  return buildContractHtml({
    draft: input.draft,
    partyAName: input.partyAName,
    partyBName: input.partyBName,
  });
}
