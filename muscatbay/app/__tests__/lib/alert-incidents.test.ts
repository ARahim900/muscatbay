import { describe, expect, it } from "vitest";

import { mergeOpenAlertIncidents, type AlertIncident } from "@/lib/alert-incidents";
import type { OperationalAlert } from "@/lib/operational-alerts";

const persisted: AlertIncident = {
    id: "incident-1",
    fingerprint: "stp:recovery",
    module: "stp",
    category: "process_performance",
    level: "error",
    title: "Recovery critical",
    message: "Recovery remains below the operating band.",
    href: "/stp",
    acknowledged_at: null,
    acknowledged_by: null,
    resolved_at: null,
};

describe("durable alert presentation", () => {
    it("keeps an open incident visible when the live source is unavailable", () => {
        const result = mergeOpenAlertIncidents([], [persisted], true, true);
        expect(result).toEqual([
            expect.objectContaining({ id: "stp:recovery", acknowledged: false, canAcknowledge: true }),
        ]);
    });

    it("adds a newly evaluated condition read-only until the server persists it", () => {
        const raw: OperationalAlert = {
            id: "water:new",
            module: "water",
            category: "water_balance",
            level: "warning",
            title: "Water loss",
            message: "Loss is above target.",
            href: "/water",
        };
        const result = mergeOpenAlertIncidents([raw], [persisted], true, true);
        expect(result).toHaveLength(2);
        expect(result[1]).toMatchObject({ id: "water:new", canAcknowledge: false });
    });
});
