import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { n, diffCell } from "@/components/water/daily-report/inline-shared";
import { formatVolume } from "@/components/water/satellite/consumptionModel";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Droplets } from "lucide-react";

/**
 * Owner rulings 2026-10-11: figures to one decimal; water gauges show the
 * full figure (1,432 m³, never "1.4k"); KPI tiles show their final value from
 * first paint. Rounding must never turn a real reading into a false zero.
 */

describe("one-decimal water figures", () => {
    it("rounds to one decimal", () => {
        expect(n(15.48)).toBe("15.5");
        expect(formatVolume(1432.456)).toBe("1,432.5");
    });

    it("keeps a recorded zero and never shows a tiny reading as zero", () => {
        expect(n(0)).toBe("0.0");
        expect(n(0.04)).toBe("<0.1");
        expect(formatVolume(0.04)).toBe("<0.1");
        expect(diffCell(0.03)).toBe("+<0.1");
        expect(diffCell(-12.34)).toBe("-12.3");
        expect(n(null)).toBe("—");
    });
});

describe("water gauge", () => {
    it("shows the full figure, never an abbreviation", () => {
        render(<LiquidProgressRing value={1432} max={2000} showPercentage={false} unit="m³" />);
        expect(screen.getByText("1,432")).toBeTruthy();
        expect(screen.queryByText(/k$/)).toBeNull();
    });
});

describe("KPI tiles", () => {
    it("render the final value immediately, with no count-up", () => {
        render(<StatsGrid stats={[{ label: "Loss", value: "12,886.3", unit: "OMR", icon: Droplets }]} />);
        expect(screen.getByText("12,886.3")).toBeTruthy();
    });
});
