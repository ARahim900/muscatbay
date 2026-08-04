import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const satelliteHtml = readFileSync(
  join(process.cwd(), "public/satellite/index.html"),
  "utf8",
);

describe("satellite zone utility camera", () => {
  it("opens Zone 3A and Zone 3B in a north-up, top-down view", () => {
    expect(satelliteHtml).toContain(
      'z.id === "Zone_VS" || z.id === "Zone_03A" || z.id === "Zone_03B"',
    );
    expect(satelliteHtml).toContain('if (utilitySelection) $("#camSel").value = "top";');
    expect(satelliteHtml).toContain(
      'map.easeTo({ center:cam.center, zoom, pitch:selectionPitch,',
    );
    expect(satelliteHtml).toContain(
      'bearing:selectionBearing, duration:1400 });',
    );
  });
});
