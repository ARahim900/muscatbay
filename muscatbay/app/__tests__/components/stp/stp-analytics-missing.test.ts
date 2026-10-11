import { describe, it, expect } from "vitest";
import { buildSTPModel, buildHeatmap, buildSTPFindings, addReading, stpEfficiency, fmtReading } from "@/components/stp/stp-analytics";
import { transformSTPOperation, type SupabaseSTPOperation } from "@/entities/stp";
import type { STPOperation } from "@/lib/mock-data";

/**
 * A NULL column in stp_operations is a day not yet recorded. It must stay
 * "missing" all the way through — never a zero flow that raises a false
 * "reuse stopped" finding or drags recovery down.
 */

const op = (date: string, inlet: number | null, tse: number | null, trips: number | null = 2): STPOperation => ({
    id: date, date, inlet_sewage: inlet, tse_for_irrigation: tse, tanker_trips: trips,
});

describe("transformSTPOperation", () => {
    const base: SupabaseSTPOperation = {
        id: 1, date: "2026-07-12", inlet_sewage: null, tse_for_irrigation: null, tanker_trips: null,
        generated_income: null, water_savings: null, total_impact: null,
        monthly_volume_input: null, monthly_volume_output: null, monthly_income: null, monthly_savings: null,
        original_id: null,
    };

    it("keeps NULL readings as null, not 0", () => {
        const t = transformSTPOperation(base);
        expect(t.inlet_sewage).toBeNull();
        expect(t.tse_for_irrigation).toBeNull();
        expect(t.tanker_trips).toBeNull();
    });

    it("keeps a recorded zero and a negative reading as they are", () => {
        const t = transformSTPOperation({ ...base, inlet_sewage: 0, tse_for_irrigation: -4 });
        expect(t.inlet_sewage).toBe(0);
        expect(t.tse_for_irrigation).toBe(-4);
    });
});

describe("STP analytics with missing readings", () => {
    const ops = [op("2026-07-10", 1000, 950), op("2026-07-11", 1000, 950), op("2026-07-12", 1000, null, null)];

    it("does not raise a 'No irrigation output' finding for an unrecorded TSE", () => {
        const findings = buildSTPFindings(buildSTPModel(ops));
        expect(findings.some((f) => f.item === "No irrigation output")).toBe(false);
    });

    it("computes efficiency only from days with both figures", () => {
        const model = buildSTPModel(ops);
        expect(model.summary.avgEfficiency).toBeCloseTo(95, 5);
        expect(model.days[2].eff).toBeNull();
    });

    it("shows a missing reading as '—' with no verdict on the heatmap", () => {
        const { rows } = buildHeatmap(buildSTPModel(ops));
        const tse = rows.find((r) => r.key === "TSE reuse")!;
        const day12 = tse.cells[11];
        expect(day12.label).toBe("—");
        expect(day12.severity).toBe("nodata");
    });

    it("reports a logged day with no inlet figure as missing, not as zero inlet", () => {
        const findings = buildSTPFindings(buildSTPModel([op("2026-07-12", null, null)]));
        expect(findings.some((f) => f.item === "Inlet reading missing")).toBe(true);
        expect(findings.some((f) => f.item === "No inlet recorded")).toBe(false);
    });
});

describe("STP reading helpers", () => {
    it("addReading stays null until something is recorded", () => {
        expect(addReading(null, null)).toBeNull();
        expect(addReading(null, 0)).toBe(0);
        expect(addReading(5, null)).toBe(5);
        expect(addReading(5, 2)).toBe(7);
    });

    it("stpEfficiency gives no verdict without both figures", () => {
        expect(stpEfficiency(1000, null)).toBeNull();
        expect(stpEfficiency(null, 900)).toBeNull();
        expect(stpEfficiency(0, 900)).toBeNull();
        expect(stpEfficiency(1000, 900)).toBe(90);
    });

    it("fmtReading renders a missing reading as a dash", () => {
        expect(fmtReading(null)).toBe("—");
        expect(fmtReading(0)).toBe("0");
    });
});
