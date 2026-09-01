import { describe, expect, it } from "vitest";
import { classifyFirePpmStatus, muscatDateKey, parsePpmEndDate } from "@/lib/fire-ppm-status";
import { buildPpmActivities } from "@/components/firefighting/ppm-programme";

describe("fire PPM schedule status", () => {
    it("parses exact single and range end dates but rejects approximate plans", () => {
        expect(parsePpmEndDate("20 Apr 2026")).toBe("2026-04-20");
        expect(parsePpmEndDate("22–25 Dec 2025")).toBe("2025-12-25");
        expect(parsePpmEndDate("Planned ~Aug 2026")).toBeNull();
    });

    it("uses the Asia/Muscat calendar date deterministically", () => {
        expect(muscatDateKey(new Date("2026-08-31T21:30:00Z"))).toBe("2026-09-01");
        expect(classifyFirePpmStatus({ scheduledDate: "02 Sep 2026", reportedOutcome: "scheduled", now: new Date("2026-09-01T08:00:00Z") })).toBe("Scheduled");
        expect(classifyFirePpmStatus({ scheduledDate: "31 Aug 2026", reportedOutcome: "scheduled", now: new Date("2026-09-01T08:00:00Z") })).toBe("Overdue");
    });

    it("does not claim completion for faults, no-access or approximate dates", () => {
        const now = new Date("2026-09-01T08:00:00Z");
        expect(classifyFirePpmStatus({ scheduledDate: "20 Apr 2026", reportedOutcome: "fault", now })).toBe("Not Evidenced");
        expect(classifyFirePpmStatus({ scheduledDate: "20 Apr 2026", reportedOutcome: "no_access", now })).toBe("Not Evidenced");
        expect(classifyFirePpmStatus({ scheduledDate: "Planned ~Aug 2026", reportedOutcome: "upcoming", now })).toBe("Not Evidenced");
        expect(buildPpmActivities(now).filter((row) => row.cycle === 3).every((row) => row.status === "Not Evidenced")).toBe(true);
    });
});
