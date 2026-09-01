import { describe, expect, it } from "vitest";
import { assessSTPReadings } from "@/lib/stp-data-quality";
import { transformSTPOperation } from "@/entities/stp";
import { buildSTPModel } from "@/components/stp/stp-analytics";

describe("STP data quality", () => {
    it("preserves missing readings instead of converting them to zero", () => {
        const transformed = transformSTPOperation({
            id: 1, date: "2026-08-01", inlet_sewage: null, tse_for_irrigation: null,
            tanker_trips: null, generated_income: null, water_savings: null,
            total_impact: null, monthly_volume_input: null, monthly_volume_output: null,
            monthly_income: null, monthly_savings: null, original_id: null,
        });
        expect(transformed.inlet_sewage).toBeNull();
        expect(transformed.tse_for_irrigation).toBeNull();
        expect(transformed.tanker_trips).toBeNull();
    });

    it("distinguishes missing, zero, negative and output above inlet", () => {
        expect(assessSTPReadings({ inlet: null, tse: null, tankerTrips: null }).findings.map((f) => f.code))
            .toEqual(["missing_inlet", "missing_tse", "missing_tanker_trips"]);
        expect(assessSTPReadings({ inlet: 100, tse: 0, tankerTrips: 0 }).findings).toHaveLength(0);
        expect(assessSTPReadings({ inlet: 100, tse: -1, tankerTrips: -2 }).findings.map((f) => f.code))
            .toEqual(["negative_tse", "negative_tanker_trips"]);
        expect(assessSTPReadings({ inlet: 100, tse: 101, tankerTrips: 1 }).findings.map((f) => f.code))
            .toEqual(["tse_exceeds_inlet", "recovery_above_100"]);
    });

    it("excludes impossible and missing TSE from savings and recovery", () => {
        const model = buildSTPModel([
            { id: "valid", date: "2026-08-01", inlet_sewage: 100, tse_for_irrigation: 90, tanker_trips: 1 },
            { id: "impossible", date: "2026-08-02", inlet_sewage: 100, tse_for_irrigation: 150, tanker_trips: 1 },
            { id: "missing", date: "2026-08-03", inlet_sewage: 100, tse_for_irrigation: null, tanker_trips: null },
        ]);
        expect(model.summary.totalTSE).toBe(90);
        expect(model.summary.avgEfficiency).toBe(90);
        expect(model.summary.invalidReadingDays).toBe(2);
        expect(model.summary.savings).toBe(90 * 1.32);
        expect(model.summary.income).toBe(2 * 4.5);
    });
});
