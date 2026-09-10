import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SupplyReconciliationTable } from "@/components/water/daily-report/inline-dc-panel";

describe("daily supply reconciliation rendering", () => {
    it("renders missing irrigation days and an all-missing total as dashes", () => {
        render(<SupplyReconciliationTable monthData={[]} selectedDay={1} />);

        const row = screen.getByRole("row", { name: /IRR Tank Z08 4300294 Irrigation/ });

        expect(within(row).getAllByText("—")).toHaveLength(2);
        expect(within(row).queryByText("0.00")).not.toBeInTheDocument();
    });

    it("shows every zone bulk alongside the direct connections, with a combined line", () => {
        render(<SupplyReconciliationTable monthData={[]} selectedDay={1} />);

        // The middle gauge's two components are both auditable from the table.
        expect(screen.getByRole("row", { name: /ΣL2 — all 7 zone bulks/ })).toBeInTheDocument();
        expect(screen.getByRole("row", { name: /ΣDC — all 9 direct connections/ })).toBeInTheDocument();
        expect(screen.getByRole("row", { name: /ΣL2 \+ ΣDC — the L2 \+ DC gauge/ })).toBeInTheDocument();
        expect(screen.getByRole("row", { name: /ZEN Project 4300348 Zone bulk/ })).toBeInTheDocument();
    });

    it("does not claim a trunk-main loss when no main-bulk reading exists", () => {
        render(<SupplyReconciliationTable monthData={[]} selectedDay={1} />);

        const lossRow = screen.getByRole("row", { name: /Trunk-main loss/ });
        // Both the day cell and the total read "—", never 0.00.
        expect(within(lossRow).getAllByText("—")).toHaveLength(2);
        expect(within(lossRow).queryByText("0.00")).not.toBeInTheDocument();
    });
});
