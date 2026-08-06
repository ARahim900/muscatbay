import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DCDailyTable } from "@/components/water/daily-report/inline-dc-panel";

describe("daily direct-connection rendering", () => {
    it("renders missing irrigation days and an all-missing total as dashes", () => {
        render(<DCDailyTable monthData={[]} />);

        const row = screen.getByRole("row", { name: /IRR Tank Z08 4300294 Irrigation/ });

        expect(within(row).getAllByText("—")).toHaveLength(2);
        expect(within(row).queryByText("0.00")).not.toBeInTheDocument();
    });
});
