import { describe, expect, it } from "vitest";

import { processReport } from "@/components/water/daily-report/inline-shared";

describe("daily report missing-reading handling", () => {
    it("preserves a missing irrigation reading as null", () => {
        const report = processReport({});
        const meter = report.dcRows.find((row) => row.account === "4300294");

        expect(meter).toMatchObject({
            rawValue: null,
            displayValue: null,
            isNullFlag: true,
        });
    });

    it("preserves an explicit irrigation zero as a real reading", () => {
        const report = processReport({ "4300294": 0 });
        const meter = report.dcRows.find((row) => row.account === "4300294");

        expect(meter).toMatchObject({
            rawValue: 0,
            displayValue: 0,
            isNullFlag: false,
        });
    });
});
