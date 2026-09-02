import { describe, expect, it } from "vitest";
import { assessSTPReadings, summariseSTPReadings } from "@/lib/stp-data-quality";
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

/**
 * These are the figures the STP page publishes as headline KPIs, chart points
 * and CSV columns. Before `summariseSTPReadings` they were plain sums of the
 * raw columns with nulls filtered out, so the page disagreed with the Plant
 * Watch tab beside it about what the plant had done.
 */
describe("summariseSTPReadings", () => {
    it("excludes negative readings from published totals and counts them", () => {
        const totals = summariseSTPReadings([
            { inlet: 100, tse: 90, tankerTrips: 2 },
            { inlet: -50, tse: -30, tankerTrips: -1 },
        ]);
        expect(totals.inlet.value).toBe(100);
        expect(totals.tse.value).toBe(90);
        expect(totals.tankerTrips.value).toBe(2);
        expect(totals.inlet.excluded).toBe(1);
        expect(totals.tse.excluded).toBe(1);
        expect(totals.tankerTrips.excluded).toBe(1);
    });

    it("never publishes a recovery above 100%", () => {
        const totals = summariseSTPReadings([
            { inlet: 100, tse: 90, tankerTrips: 1 },
            { inlet: 100, tse: 400, tankerTrips: 1 },
        ]);
        expect(totals.recovery.pct).toBe(90);
        expect(totals.recovery.days).toBe(1);
        expect(totals.tse.value).toBe(90);
        expect(totals.rowsWithImpossibleReadings).toBe(1);
    });

    it("keeps missing and impossible readings in separate counts", () => {
        const totals = summariseSTPReadings([
            { inlet: 100, tse: 90, tankerTrips: 2 },
            { inlet: null, tse: null, tankerTrips: null },
            { inlet: 100, tse: 150, tankerTrips: 1 },
        ]);
        expect(totals.tse.evidenced).toBe(1);
        expect(totals.tse.missing).toBe(1);
        expect(totals.tse.excluded).toBe(1);
        expect(totals.rows).toBe(3);
    });

    it("counts a TSE volume with no inlet reading, which has no computable recovery", () => {
        const totals = summariseSTPReadings([{ inlet: null, tse: 80, tankerTrips: 1 }]);
        expect(totals.tse.value).toBe(80);
        expect(totals.recovery.pct).toBeNull();
        expect(totals.recovery.days).toBe(0);
    });

    it("returns null totals rather than zero when nothing is usable", () => {
        const totals = summariseSTPReadings([{ inlet: null, tse: null, tankerTrips: null }]);
        expect(totals.inlet.value).toBeNull();
        expect(totals.tse.value).toBeNull();
        expect(totals.tankerTrips.value).toBeNull();
    });

    it("treats zero as a real reading, not as missing", () => {
        const totals = summariseSTPReadings([{ inlet: 0, tse: 0, tankerTrips: 0 }]);
        expect(totals.inlet.value).toBe(0);
        expect(totals.inlet.evidenced).toBe(1);
        expect(totals.inlet.missing).toBe(0);
    });
});
