import { describe, expect, it } from "vitest";
import { summariseWidgetWater, type WidgetWaterRow } from "@/lib/widget/water-summary";
import { processReport } from "@/components/water/daily-report/report-data";
import { computeBriefing } from "@/components/water/daily-report/briefing-metrics";
import { ZONE_BULK_CONFIG } from "@/lib/water-accounts";

const ACCOUNTS = [...new Set(ZONE_BULK_CONFIG.flatMap((z) => [z.l2Account, ...z.l3Accounts]))];

/** Every zone account read on days 1–4 (L2 = 100, each L3 = 1); day 5 left to each test. */
function month(day5: (account: string) => number | null): WidgetWaterRow[] {
    return ACCOUNTS.map((account) => {
        const isBulk = ZONE_BULK_CONFIG.some((z) => z.l2Account === account);
        const row: WidgetWaterRow = { account_number: account };
        for (let d = 1; d <= 4; d++) row[`day_${d}`] = isBulk ? 100 : 1;
        row.day_5 = day5(account);
        return row;
    });
}

describe("summariseWidgetWater", () => {
    it("reports the latest day with any reading, with the Daily page's own figures", () => {
        const rows = month((account) => (account === "4300343" ? 140 : null));
        // Day 5 has one reading, so day 5 is the day — the page's default too.
        const summary = summariseWidgetWater(rows, "Oct-26", 2026);
        const readings = Object.fromEntries(rows.map((r) => [r.account_number, r.day_5 === null ? null : Number(r.day_5)]));
        const briefing = computeBriefing(processReport(readings), null);
        expect(summary).not.toBeNull();
        expect(summary?.date).toBe("2026-10-05");
        expect(summary?.supplyM3).toBe(briefing.l2Total);
        expect(summary?.lossM3).toBe(briefing.lossM3);
        expect(summary?.lossPct).toBe(briefing.lossPct);
        expect(summary?.metersRead).toBe(1);
        expect(summary?.partial).toBe(true);
    });

    it("names the zone losing the most water and is not partial when every meter is read", () => {
        const rows = month(() => null).map((row) =>
            row.account_number === "4300345" ? { ...row, day_4: 300 } : row,
        );
        const summary = summariseWidgetWater(rows, "Oct-26", 2026);
        const zone5 = ZONE_BULK_CONFIG.find((z) => z.l2Account === "4300345");
        expect(summary?.date).toBe("2026-10-04");
        expect(summary?.partial).toBe(false);
        expect(summary?.metersRead).toBe(summary?.metersTotal);
        expect(summary?.worstZone?.name).toBe(zone5?.zoneName);
        expect(summary?.worstZone?.lossM3).toBe(300 - (zone5?.l3Accounts.length ?? 0));
    });

    it("never fills a missing reading: an empty month gives no summary", () => {
        const rows = ACCOUNTS.map((account) => ({ account_number: account }) as WidgetWaterRow);
        expect(summariseWidgetWater(rows, "Oct-26", 2026)).toBeNull();
    });

    it("rejects a month label it does not recognise", () => {
        expect(summariseWidgetWater(month(() => 1), "Octo", 2026)).toBeNull();
    });
});

describe("summariseWidgetWater calendar", () => {
    it("ignores a reading in a day the month does not have", () => {
        const rows: WidgetWaterRow[] = [
            { account_number: "4300343", day_27: 80, day_30: 99, day_31: 99 },
        ];
        expect(summariseWidgetWater(rows, "Feb-26", 2026)?.date).toBe("2026-02-27");
    });
});

describe("summariseWidgetWater zones", () => {
    it("gives every zone its bulk, the meters that were read, and how many were missing", () => {
        const zone5 = ZONE_BULK_CONFIG.find((z) => z.l2Account === "4300345");
        if (!zone5) throw new Error("Zone 5 is not configured");
        const missing = new Set(zone5.l3Accounts.slice(0, 3));
        const rows = month((account) => {
            if (account === zone5.l2Account) return 87.7;
            if (zone5.l3Accounts.includes(account)) return missing.has(account) ? null : 1;
            return null;
        });
        const zone = summariseWidgetWater(rows, "Oct-26", 2026)?.zones.find((z) => z.name === zone5.zoneName);
        const read = zone5.l3Accounts.length - 3;
        expect(zone).toEqual({
            name: zone5.zoneName,
            bulkM3: 87.7,
            metersM3: read,
            lossM3: Math.round((87.7 - read) * 100) / 100,
            lossPct: Math.round(((87.7 - read) / 87.7) * 1000) / 10,
            severity: expect.any(String),
            metersRead: read,
            metersTotal: zone5.l3Accounts.length,
        });
    });

    it("never invents a loss for a zone whose bulk was not read", () => {
        const rows = month((account) => (account === "4300343" ? 50 : null));
        const zones = summariseWidgetWater(rows, "Oct-26", 2026)?.zones ?? [];
        const unread = zones.find((z) => z.bulkM3 === null);
        expect(zones).toHaveLength(ZONE_BULK_CONFIG.length);
        expect(unread?.lossM3).toBeNull();
        expect(unread?.lossPct).toBeNull();
        expect(unread?.severity).toBe("nodata");
    });
});
