import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { clearPageCache } from "@/lib/page-cache";
import type { StpElectricityMonth } from "@/entities/stp-electricity";

const getStpElectricityMonths = vi.fn<() => Promise<StpElectricityMonth[]>>();
vi.mock("@/functions/api/stp-electricity", () => ({ getStpElectricityMonths: () => getStpElectricityMonths() }));

class NoopObserver { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", NoopObserver);
// jsdom ships no matchMedia; the period panel reads it to open on desktop.
vi.stubGlobal("matchMedia", () => ({
    matches: true, media: "", addEventListener: () => {}, removeEventListener: () => {},
}));

const { StpElectricityPanel } = await import("@/components/stp/stp-electricity-panel");

const aug26: StpElectricityMonth = {
    reportMonth: "2026-08-01", periodStart: "2026-07-26", periodEnd: "2026-08-25",
    owatcoKwh: 27010, owatcoStatus: "reported", owatcoNote: null,
    namaKwh: null, billedOmr: 1088.659, billedStatus: "billed", billedNote: null,
};

describe("StpElectricityPanel", () => {
    beforeEach(() => {
        clearPageCache();
        getStpElectricityMonths.mockReset();
    });

    it("shows an error with Retry when the read fails — never an empty chart", async () => {
        getStpElectricityMonths.mockRejectedValue(new Error("permission denied"));
        render(<StpElectricityPanel operations={[]} />);
        await waitFor(() => expect(screen.getByText("STP electricity could not be loaded")).toBeTruthy());
        expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    });

    it("shows the latest month and billed cost to one decimal, and '—' where data is missing", async () => {
        getStpElectricityMonths.mockResolvedValue([aug26]);
        render(<StpElectricityPanel operations={[]} />);
        await waitFor(() => expect(screen.getAllByText("27,010").length).toBeGreaterThan(0));
        // Period bill KPI and the register row.
        expect(screen.getAllByText("1,088.7").length).toBe(2);
        expect(screen.getByText("1 of 1 Nama bills · Cost Reflective Tariff")).toBeTruthy();
        // No complete inlet log → no energy-per-m³ figure, stated as missing.
        expect(screen.getByText("Needs a complete daily inlet log for a report period")).toBeTruthy();
    });

    it("opens on the latest year and re-scopes KPIs and the register when another year is picked", async () => {
        const dec25: StpElectricityMonth = {
            ...aug26, reportMonth: "2025-12-01", periodStart: "2025-11-26", periodEnd: "2025-12-25",
            owatcoKwh: 21000, billedOmr: null, billedStatus: "not_available",
        };
        getStpElectricityMonths.mockResolvedValue([dec25, aug26]);
        render(<StpElectricityPanel operations={[]} />);

        await waitFor(() => expect(screen.getByRole("button", { name: "Filter by year 2026" }).getAttribute("aria-pressed")).toBe("true"));
        expect(screen.getAllByText("Aug-26").length).toBeGreaterThan(0);
        expect(screen.queryByText("Dec-25")).toBeNull();
        expect(screen.getByText("1 of 1 OWATCO monthly reports")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Filter by year 2025" }));

        await waitFor(() => expect(screen.getAllByText("Dec-25").length).toBeGreaterThan(0));
        expect(screen.queryByText("Aug-26")).toBeNull();
        expect(screen.getAllByText("21,000").length).toBeGreaterThan(0);
        // Dec-25 has no reliable bill: the period bill is stated as missing, not 0.
        expect(screen.getByText("No reliable Nama bill in this period")).toBeTruthy();
    });
});
