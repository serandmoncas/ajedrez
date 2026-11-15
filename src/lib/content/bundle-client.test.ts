import { describe, expect, it } from "vitest";
import type { BundleItem } from "./bundle-client";

describe("BundleItem", () => {
  it("narrows by kind and exposes kind-specific fields without casts", () => {
    const read = (item: BundleItem): number => {
      if (item.kind === "pattern") return item.positions?.length ?? 0;
      if (item.kind === "opening") return item.lines.length;
      return 0;
    };
    expect(typeof read).toBe("function");
  });
});
