import { describe, it, expect } from "vitest";
import {
    energyIntensity, indicativeRateBaisa, indicativeRates, latestCompleteYear, latestReported, monthLabel,
    periodSummary, yearSummary,
} from "@/components/stp/stp-electricity";
import { transformStpElectricityMonth } from "@/functions/api/stp-electricity";
import type { StpElectricityMonth } from "@/entities/stp-electricity";
import type { STPOperation } from "@/lib/mock-data";

/**
 * STP electricity: a missing report or bill stays missing, the indicative rate
 * needs both figures, and energy per m³ is computed only from a complete inlet
 * log over the report's own days.
 */

const month = (reportMonth: string, partial: Partial<StpElectricityMonth> = {}): StpElectricityMonth => ({
    reportMonth,
    periodStart: null,
    periodEnd: null,
    owatcoKwh: null,
    owatcoStatus: "not_found",
    owatcoNote: null,
    namaKwh: null,
    billedOmr: null,
    billedStatus: "not_available",
    billedNote: null,
    ...partial,
});

const op = (date: string, inlet: number | null): STPOperation => ({
    id: date, date, inlet_sewage: inlet, tse_for_irrigation: null, tanker_trips: null,
});

describe("reader transform", () => {
    it("parses PostgREST numeric strings and keeps NULL as null", () => {
        const r = transformStpElectricityMonth({
            report_month: "2026-08-01", period_start: "2026-07-26", period_end: "2026-08-25",
            owatco_kwh: "27010.0", owatco_status: "reported", owatco_note: null,
            nama_kwh: null, billed_omr: "1088.659", billed_status: "billed", billed_note: null,
        });
        expect(r.owatcoKwh).toBe(27010);
        expect(r.billedOmr).toBe(1088.659);
        expect(r.namaKwh).toBeNull();
    });
});

describe("indicative rate", () => {
    it("is bill ÷ kWh in baisa — Aug-25 at 1,049.635 OMR over 24,895 kWh is 42.2", () => {
        const r = month("2025-08-01", { owatcoKwh: 24895, owatcoStatus: "reported", billedOmr: 1049.635, billedStatus: "billed" });
        expect(indicativeRateBaisa(r)).toBeCloseTo(42.16, 2);
    });

    it("gives no rate without both figures", () => {
        expect(indicativeRateBaisa(month("2026-05-01", { owatcoKwh: 27479, owatcoStatus: "reported", billedStatus: "unreliable" }))).toBeNull();
        expect(indicativeRateBaisa(month("2024-03-01", { namaKwh: 20398 }))).toBeNull();
    });

    it("gives no rate from an unreliable bill even when both figures exist", () => {
        const unreliable = month("2026-05-01", { owatcoKwh: 27479, owatcoStatus: "reported", billedOmr: 34.241, billedStatus: "unreliable" });
        expect(indicativeRateBaisa(unreliable)).toBeNull();
    });
});

describe("energy per m³ treated", () => {
    const row = month("2026-08-01", { periodStart: "2026-08-01", periodEnd: "2026-08-03", owatcoKwh: 3000, owatcoStatus: "reported" });

    it("divides the report kWh by the inlet logged on the same days", () => {
        const ops = [op("2026-08-01", 800), op("2026-08-02", 700), op("2026-08-03", 1000), op("2026-08-04", 999)];
        expect(energyIntensity(row, ops).kwhPerM3).toBeCloseTo(1.2, 5);
    });

    it("gives no figure when any day of the period has no inlet reading", () => {
        const ops = [op("2026-08-01", 800), op("2026-08-02", null), op("2026-08-03", 1000)];
        const r = energyIntensity(row, ops);
        expect(r.kwhPerM3).toBeNull();
        expect(r.daysRecorded).toBe(2);
        expect(r.daysInPeriod).toBe(3);
    });
});

describe("year summaries", () => {
    const rows = [
        ...Array.from({ length: 12 }, (_, i) =>
            month(`2025-${String(i + 1).padStart(2, "0")}-01`, { owatcoKwh: 20000, owatcoStatus: "reported", billedOmr: 700, billedStatus: "billed" })),
        month("2026-01-01", { owatcoKwh: 25081, owatcoStatus: "reported" }),
        month("2026-09-01", { owatcoStatus: "not_received" }),
    ];

    it("counts only months that have a figure", () => {
        expect(yearSummary(rows, "2026")).toMatchObject({ owatcoKwh: 25081, owatcoMonths: 1, billedMonths: 0 });
    });

    it("picks the latest year with all 12 reports", () => {
        expect(latestCompleteYear(rows)).toMatchObject({ year: "2025", owatcoKwh: 240000, billedOmr: 8400 });
    });

    it("finds the latest reported month, skipping a report not yet received", () => {
        expect(latestReported(rows)?.reportMonth).toBe("2026-01-01");
        expect(monthLabel("2026-01-01")).toBe("Jan-26");
    });
});

describe("period summaries and indicative rates", () => {
    const jun = month("2026-06-01", { owatcoKwh: 25000, owatcoStatus: "reported", billedOmr: 1000, billedStatus: "billed" });
    const jul = month("2026-07-01", { owatcoKwh: 26000, owatcoStatus: "reported", billedOmr: 1200, billedStatus: "unreliable" });
    const oct = month("2025-10-01", { owatcoKwh: 20000, owatcoStatus: "reported", billedOmr: 600, billedStatus: "billed" });
    const nov = month("2025-11-01", { owatcoStatus: "not_received" });

    it("sums only the months that have each figure and says how many", () => {
        expect(periodSummary([oct, nov, jun, jul])).toEqual({ owatcoKwh: 71000, owatcoMonths: 3, billedOmr: 1600, billedMonths: 2 });
        expect(periodSummary([nov])).toEqual({ owatcoKwh: 0, owatcoMonths: 0, billedOmr: 0, billedMonths: 0 });
    });

    it("splits the indicative rate by season and ignores unreliable bills", () => {
        const r = indicativeRates([oct, jun, jul]);
        expect(r.summer).toBeCloseTo(40, 5);   // 1000 / 25000 — Jul's unreliable bill is excluded
        expect(r.winter).toBeCloseTo(30, 5);   // 600 / 20000
        expect(r.overall).toBeCloseTo(35.556, 2);
    });

    it("returns null where no month in the period qualifies", () => {
        expect(indicativeRates([jul, nov])).toEqual({ overall: null, summer: null, winter: null });
        expect(indicativeRates([jun]).winter).toBeNull();
    });
});
