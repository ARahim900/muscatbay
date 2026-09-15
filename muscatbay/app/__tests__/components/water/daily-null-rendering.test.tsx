import { render, screen, within, fireEvent } from "@testing-library/react";
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

    it("collapses a section's meter rows while keeping its subtotal on screen", () => {
        render(<SupplyReconciliationTable monthData={[]} selectedDay={1} />);

        const toggle = screen.getByRole("button", { name: /Zone bulks \(L2\)/ });
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("row", { name: /ZEN Project 4300348 Zone bulk/ })).toBeInTheDocument();

        fireEvent.click(toggle);

        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("row", { name: /ZEN Project 4300348 Zone bulk/ })).not.toBeInTheDocument();
        // The balance must stay readable with the detail folded away.
        expect(screen.getByRole("row", { name: /ΣL2 — all 7 zone bulks/ })).toBeInTheDocument();
        expect(screen.getByRole("row", { name: /ΣL2 \+ ΣDC — the L2 \+ DC gauge/ })).toBeInTheDocument();

        fireEvent.click(toggle);
        expect(screen.getByRole("row", { name: /ZEN Project 4300348 Zone bulk/ })).toBeInTheDocument();
    });

    it("collapses each of the three sections independently", () => {
        render(<SupplyReconciliationTable monthData={[]} selectedDay={1} />);

        for (const name of [/Main bulk \(L1\)/, /Zone bulks \(L2\)/, /Direct connections \(DC\)/]) {
            expect(screen.getByRole("button", { name })).toHaveAttribute("aria-expanded", "true");
        }

        fireEvent.click(screen.getByRole("button", { name: /Direct connections \(DC\)/ }));

        expect(screen.getByRole("button", { name: /Direct connections \(DC\)/ })).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("row", { name: /IRR Tank Z08 4300294 Irrigation/ })).not.toBeInTheDocument();
        // Folding DC must not fold the others.
        expect(screen.getByRole("button", { name: /Zone bulks \(L2\)/ })).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("row", { name: /ZEN Project 4300348 Zone bulk/ })).toBeInTheDocument();
    });
});
