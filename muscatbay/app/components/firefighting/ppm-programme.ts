/**
 * @fileoverview BEC fire-safety AMC — PPM programme reference data.
 *
 * WHAT THIS IS
 * The BEC PPM plan as issued by the contractor: 3 cycles per year × 4
 * designated zones × their area groups, with the visit date and outcome BEC
 * reported for each. It lives here — outside the page component — so the plan
 * can be updated when BEC issues the next cycle without touching page logic.
 *
 * WHAT THIS IS NOT
 * There is deliberately no scheduling engine, due-date computation or
 * completion tracking here. These records are a transcript of BEC's issued
 * plan and reported outcomes, rendered read-only.
 *
 * SOURCE
 * BEC PPM plan emails (Dec-2025 completion + 20–30 Apr-2026 plan,
 * ref MIS-SBJ-25-077). Maintained by hand; see REFERENCE_AS_OF.
 *
 * IDEALLY THIS LIVES IN THE DATABASE — a `fire_ppm_plan` table keyed by
 * (cycle, area_group) would let operations update dates and outcomes without
 * a deploy. Until that table exists, this file is the single edit point.
 *
 * @module components/firefighting/ppm-programme
 */

import {
    classifyFirePpmStatus,
    type FirePpmEvidenceOutcome,
    type FirePpmScheduleStatus,
} from "@/lib/fire-ppm-status";

/** When the contents below were last reconciled against BEC correspondence. */
export const PPM_PROGRAMME_AS_OF = "May 2026";

/** Provenance shown in the UI so operators know this is a transcribed plan. */
export const PPM_PROGRAMME_SOURCE =
    "Transcribed from the BEC PPM plan emails (ref MIS-SBJ-25-077).";

export type Cycle = 1 | 2 | 3;
export type ZoneKey = "zone1" | "zone3" | "zone5" | "vs";
export type PpmStatus = FirePpmEvidenceOutcome;

export interface PpmActivity {
    id: string;
    cycle: Cycle;
    zone: ZoneKey;
    area: string;
    systems: string[];
    date: string;
    status: FirePpmScheduleStatus;
    reportedOutcome: PpmStatus;
    notes?: string;
}

export interface ZoneDef {
    key: ZoneKey;
    label: string;
    short: string;
    scope: string;
}

export interface CycleDef {
    key: Cycle;
    label: string;
    window: string;
}

export const ZONES: ZoneDef[] = [
    { key: "zone1", label: "Zone 1", short: "Z1", scope: "Staff Accommodation (Bldgs 1–8) + external hydrants" },
    { key: "zone3", label: "Zone 3", short: "Z3", scope: "Residential Apartments 44–62, 74 & 75" },
    { key: "zone5", label: "Zone 5", short: "Z5", scope: "Security, Nursery, Control Room, Taxi & ROP" },
    { key: "vs", label: "Village Square", short: "VS", scope: "Central fire plant, pumps, FM & Experience Centre" },
];

export const ZONE_BY_KEY: Record<ZoneKey, ZoneDef> = ZONES.reduce(
    (acc, z) => { acc[z.key] = z; return acc; },
    {} as Record<ZoneKey, ZoneDef>,
);

export const CYCLES: CycleDef[] = [
    { key: 1, label: "Cycle 1", window: "07–25 Dec 2025" },
    { key: 2, label: "Cycle 2", window: "20–30 Apr 2026" },
    { key: 3, label: "Cycle 3", window: "~Aug 2026" },
];

export const CYCLE_BY_KEY: Record<Cycle, CycleDef> = CYCLES.reduce(
    (acc, c) => { acc[c.key] = c; return acc; },
    {} as Record<Cycle, CycleDef>,
);

/** The 10 BEC visit groups, mapped to the 4 designated zones. */
export const AREA_GROUPS: { key: string; zone: ZoneKey; area: string; systems: string[] }[] = [
    { key: "sa14", zone: "zone1", area: "Staff Accommodation Bldgs 1–4", systems: ["FA", "Hose Reel", "FE"] },
    { key: "sa58", zone: "zone1", area: "Staff Accommodation Bldgs 5–8", systems: ["FA", "Hose Reel", "FE"] },
    { key: "ext", zone: "zone1", area: "External Hydrants + Staff Accom.", systems: ["Hydrants"] },
    { key: "ap1", zone: "zone3", area: "Apartments 44, 45, 46, 74, 75", systems: ["FA", "FE"] },
    { key: "ap2", zone: "zone3", area: "Apartments 47, 48, 49, 50, 51", systems: ["FA", "FE"] },
    { key: "ap3", zone: "zone3", area: "Apartments 52, 53, 54, 55, 56", systems: ["FA", "FE"] },
    { key: "ap4", zone: "zone3", area: "Apartments 57, 58, 59, 60, 61, 62", systems: ["FA", "FE"] },
    { key: "sec", zone: "zone5", area: "Security, Nursery, Control Room, Taxi, ROP", systems: ["FA", "FE"] },
    { key: "tech", zone: "vs", area: "Technical Bldg, STP, Village Square", systems: ["FA", "FE"] },
    { key: "fm", zone: "vs", area: "FM Office, Experience Centre, Pump Testing", systems: ["FA", "FF"] },
];

/** Per-cycle date + reported outcome + notes, keyed by area-group. */
export const CYCLE_DETAIL: Record<Cycle, Record<string, { date: string; status: PpmStatus; notes?: string }>> = {
    1: {
        fm: { date: "07 Dec 2025", status: "done", notes: "Incl. electric, diesel & jockey fire-pump testing" },
        sa14: { date: "08 Dec 2025", status: "fault", notes: "Bldg-1 Rm-4 no access for extinguisher service; Bldg-1 Rm-7 DCP 4.5 kg extinguisher missing; Bldg-2 GF electrical room CO₂ 5 kg found empty" },
        sa58: { date: "09 Dec 2025", status: "fault", notes: "Bldg-8 smoke detector SD-32 defective" },
        sec: { date: "10 Dec 2025", status: "done" },
        tech: { date: "11 Dec 2025", status: "done" },
        ap1: { date: "13 Dec 2025", status: "done" },
        ap2: { date: "15 Dec 2025", status: "done" },
        ap3: { date: "17 Dec 2025", status: "done" },
        ap4: { date: "20 Dec 2025", status: "done" },
        ext: { date: "22–25 Dec 2025", status: "done", notes: "27 external + 3 staff-accommodation hydrants" },
    },
    2: {
        sa14: { date: "20 Apr 2026", status: "done" },
        sa58: { date: "21 Apr 2026", status: "done" },
        sec: { date: "22 Apr 2026", status: "done" },
        tech: { date: "23 Apr 2026", status: "done" },
        fm: { date: "25 Apr 2026", status: "done", notes: "Incl. fire-pump testing; follow-up spares quotes raised May–Jun 2026 (refs 223425, 222982, 220240)" },
        ap1: { date: "26 Apr 2026", status: "done" },
        ap2: { date: "27 Apr 2026", status: "done" },
        ap3: { date: "28 Apr 2026", status: "done" },
        ap4: { date: "29 Apr 2026", status: "done" },
        ext: { date: "30 Apr 2026", status: "done" },
    },
    3: {
        sa14: { date: "Planned ~Aug 2026", status: "upcoming" },
        sa58: { date: "Planned ~Aug 2026", status: "upcoming" },
        ext: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap1: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap2: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap3: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap4: { date: "Planned ~Aug 2026", status: "upcoming" },
        sec: { date: "Planned ~Aug 2026", status: "upcoming" },
        tech: { date: "Planned ~Aug 2026", status: "upcoming" },
        fm: { date: "Planned ~Aug 2026", status: "upcoming" },
    },
};

/** Flattened cycle × area-group rows — what the Maintenance table renders. */
export function buildPpmActivities(now: Date): PpmActivity[] {
    return ([1, 2, 3] as Cycle[]).flatMap((cycle) =>
    AREA_GROUPS.map((g) => {
        const d = CYCLE_DETAIL[cycle][g.key];
        return {
            id: `c${cycle}-${g.key}`,
            cycle,
            zone: g.zone,
            area: g.area,
            systems: g.systems,
            date: d.date,
            status: classifyFirePpmStatus({ scheduledDate: d.date, reportedOutcome: d.status, now }),
            reportedOutcome: d.status,
            notes: d.notes,
        };
    }));
}

/** Systems abbreviation legend used by the Maintenance tab. */
export const SYSTEM_LEGEND: [string, string][] = [
    ["FA", "Fire Alarm"],
    ["FF", "Fire-Fighting (pumps / sprinkler)"],
    ["FE", "Fire Extinguishers"],
    ["Hose Reel", "Hose Reels"],
    ["Hydrants", "Fire Hydrants"],
];
