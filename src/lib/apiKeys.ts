import { createHash, randomBytes } from "node:crypto";

/**
 * Prefix voor alle ArchonPro API-sleutels. Handig herkenbaar en makkelijk te
 * scannen in secret-scanners.
 */
const KEY_PREFIX = "ap_live_";

export type GeneratedApiKey = {
  /** De volledige sleutel — wordt maar één keer aan de gebruiker getoond. */
  raw: string;
  /** SHA-256 hash (hex) die we in de database bewaren. */
  hash: string;
  /** Zichtbaar begin van de sleutel voor herkenning in de lijst. */
  prefix: string;
};

/** Genereert een nieuwe API-sleutel + de bijbehorende hash en prefix. */
export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("base64url");
  const raw = `${KEY_PREFIX}${secret}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, KEY_PREFIX.length + 6),
  };
}

/** Hasht een (ruwe) API-sleutel op dezelfde manier als bij het aanmaken. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw.trim()).digest("hex");
}
