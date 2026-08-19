import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("taken server-action contract", () => {
  it("exporteert geen TypeScript-types als server actions", async () => {
    const source = await readFile(
      new URL("../../../app/dashboard/taken/actions.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/\bexport\s+type\b/);
  });
});
