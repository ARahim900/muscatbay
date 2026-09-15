import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";
describe("design-system class merging", () => {
  it("keeps button foreground colour alongside each custom type size", () => {
    for (const size of [
      "display",
      "title",
      "body",
      "label",
      "caption",
      "eyebrow",
      "kpi",
    ]) {
      const classes = cn("bg-primary text-on-primary", `text-${size}`);
      expect(classes).toContain("text-on-primary");
      expect(classes).toContain(`text-${size}`);
    }
  });
  it("still resolves genuine size and colour overrides", () => {
    expect(cn("text-label text-body", "text-muted text-fg")).toBe(
      "text-body text-fg",
    );
  });
});
