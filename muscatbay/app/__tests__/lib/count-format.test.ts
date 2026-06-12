import { describe, it, expect } from "vitest";
import { parseMetricValue, formatMetricValue } from "@/lib/count-format";

describe("parseMetricValue", () => {
    it("parses grouped decimals with a unit suffix", () => {
        const p = parseMetricValue("92,051.5 OMR");
        expect(p).toEqual({ prefix: "", value: 92051.5, suffix: " OMR", decimals: 1, grouped: true });
    });

    it("parses grouped integers", () => {
        const p = parseMetricValue("2,847 m³");
        expect(p).toEqual({ prefix: "", value: 2847, suffix: " m³", decimals: 0, grouped: true });
    });

    it("parses plain integers without inventing grouping", () => {
        const p = parseMetricValue("148 kWh");
        expect(p).toEqual({ prefix: "", value: 148, suffix: " kWh", decimals: 0, grouped: false });
    });

    it("parses percentages", () => {
        const p = parseMetricValue("98.2%");
        expect(p).toEqual({ prefix: "", value: 98.2, suffix: "%", decimals: 1, grouped: false });
    });

    it("parses currency prefixes", () => {
        const p = parseMetricValue("OMR 1,234");
        expect(p).toEqual({ prefix: "OMR ", value: 1234, suffix: "", decimals: 0, grouped: true });
    });

    it("parses negative trends", () => {
        const p = parseMetricValue("-12.4%");
        expect(p).toEqual({ prefix: "", value: -12.4, suffix: "%", decimals: 1, grouped: false });
    });

    it("returns null for non-numeric values", () => {
        expect(parseMetricValue("N/A")).toBeNull();
        expect(parseMetricValue("—")).toBeNull();
        expect(parseMetricValue("")).toBeNull();
    });
});

describe("formatMetricValue", () => {
    it("reproduces the original string exactly at the final value", () => {
        const samples = ["92,051.5 OMR", "2,847 m³", "148 kWh", "98.2%", "OMR 1,234", "1,250,300 units"];
        for (const sample of samples) {
            const p = parseMetricValue(sample);
            expect(p).not.toBeNull();
            expect(formatMetricValue(p!, p!.value)).toBe(sample);
        }
    });

    it("keeps decimal places stable during intermediate frames", () => {
        const p = parseMetricValue("92,051.5 OMR")!;
        expect(formatMetricValue(p, 12.345)).toBe("12.3 OMR");
        expect(formatMetricValue(p, 0)).toBe("0.0 OMR");
    });

    it("honors the no-grouping convention of the source", () => {
        const p = parseMetricValue("1480 kWh")!;
        expect(formatMetricValue(p, 1480)).toBe("1480 kWh");
    });
});
