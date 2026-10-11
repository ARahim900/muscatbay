import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { clearPageCache } from "@/lib/page-cache";
import type { StpElectricityMonth } from "@/entities/stp-electricity";

const getStpElectricityMonths = vi.fn<() => Promise<StpElectricityMonth[]>>();
vi.mock("@/functions/api/stp-electricity", () => ({ getStpElectricityMonths: () => getStpElectricityMonths() }));

class NoopObserver { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", NoopObserver);

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
        expect(screen.getByText("1,088.7")).toBeTruthy();
        // No complete inlet log → no energy-per-m³ figure, stated as missing.
        expect(screen.getByText("Needs a complete daily inlet log for a report period")).toBeTruthy();
    });
});
