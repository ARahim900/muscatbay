export type FirePpmEvidenceOutcome = "done" | "scheduled" | "upcoming" | "fault" | "no_access";
export type FirePpmScheduleStatus = "Completed" | "Scheduled" | "Overdue" | "Not Evidenced";

const MONTH_NUMBER: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** Exact BEC dates only. Approximate text such as "~Aug" is not evidence. */
export function parsePpmEndDate(dateText: string): string | null {
    if (/planned|~|tbc|approx/i.test(dateText)) return null;
    const match = /(?:\d{1,2}\s*[–-]\s*)?(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/.exec(dateText.trim());
    if (!match) return null;
    const month = MONTH_NUMBER[match[2]];
    if (!month) return null;
    const day = match[1].padStart(2, "0");
    const iso = `${match[3]}-${month}-${day}`;
    const parsed = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso ? null : iso;
}

export function muscatDateKey(now: Date): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Muscat",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    return `${value("year")}-${value("month")}-${value("day")}`;
}

export function classifyFirePpmStatus(input: {
    scheduledDate: string;
    reportedOutcome: FirePpmEvidenceOutcome;
    now: Date;
}): FirePpmScheduleStatus {
    if (input.reportedOutcome === "done") return "Completed";
    // A fault or no-access report is evidence of an attempted visit, not
    // evidence that the planned maintenance was completed.
    if (input.reportedOutcome === "fault" || input.reportedOutcome === "no_access") return "Not Evidenced";

    const scheduledEnd = parsePpmEndDate(input.scheduledDate);
    if (!scheduledEnd) return "Not Evidenced";
    return muscatDateKey(input.now) <= scheduledEnd ? "Scheduled" : "Overdue";
}
