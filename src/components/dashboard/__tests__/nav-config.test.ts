import { describe, expect, it } from "vitest";
import {
  getActiveMobileTabId,
  getMobileDetailParent,
  getMobileSwipeTabIndex,
} from "@/components/dashboard/nav-config";

describe("mobile dashboard navigation", () => {
  it("keeps offerte pages under the Offertes tab", () => {
    expect(getActiveMobileTabId("/dashboard/offertes/123")).toBe("offertes");
    expect(getMobileDetailParent("/dashboard/offertes/123")).toBe(
      "/dashboard/offertes",
    );
  });

  it("classifies project pages under More instead of Offertes", () => {
    const pathname = "/dashboard/offertes/projecten/123";

    expect(getActiveMobileTabId(pathname)).toBe("more");
    expect(getMobileSwipeTabIndex(pathname)).toBe(-1);
    expect(getMobileDetailParent(pathname)).toBeNull();
  });
});
