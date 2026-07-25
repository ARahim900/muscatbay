/**
 * @fileoverview BEC fire-safety AMC — contract reference data.
 *
 * WHAT THIS IS
 * Figures transcribed from signed paperwork: the AMC contract summary, the
 * contractual response-time SLA, the asset counts named in the contract scope,
 * the insurance limits, and the sewage-tanker discharge agreements. None of
 * these have a table in Supabase today, so they are held here as a single,
 * clearly-marked configuration module rather than typed into JSX.
 *
 * WHAT THIS IS NOT
 * Not live data. Every consumer must label it as contract reference, dated by
 * REFERENCE_AS_OF, so an operator is never shown a static figure that looks
 * like a live reading. Asset counts here are the CONTRACT's scope counts —
 * the live register in `fire_safety_equipment` is the operational source.
 *
 * PRIVACY
 * No personal contact details are stored in this repository. Tanker
 * counterparty contacts are recorded by role only; the individual names,
 * emails and phone numbers live with the FM office / the signed agreements.
 *
 * IDEALLY THIS LIVES IN THE DATABASE — see the module report: a
 * `fire_amc_contract`, `fire_amc_sla`, `fire_amc_scope_counts`,
 * `fire_amc_insurance` and `tanker_discharge_agreements` set of tables would
 * make all of this editable without a deploy, and the tanker contacts could
 * then be access-controlled instead of omitted.
 *
 * @module app/firefighting/contract-reference
 */

/** When these figures were last reconciled against the signed paperwork. */
export const REFERENCE_AS_OF = "May 2026";

/** Shown wherever this module's values are rendered. */
export const REFERENCE_NOTE =
    "Contract reference — transcribed from the signed BEC AMC paperwork, not live data.";

/** AMC contract summary (label / value pairs, rendered in order). */
export const AMC_CONTRACT_SUMMARY: readonly (readonly [string, string])[] = [
    ["Contractor", "Bahwan Engineering Co. (BEC)"],
    ["Ref", "MIS-SBJ-25-077"],
    ["Type", "Non-Comprehensive AMC"],
    ["Period", "01 Nov 2025 → 31 Oct 2027 (24 months)"],
    ["Annual Fee", "RO 7,250 net (+ 5% VAT = RO 7,612.50)"],
    ["2-Year Total", "RO 15,225.00"],
    ["PPM Frequency", "4-Monthly (FA & FF) · Half-Yearly (FE)"],
    ["Cycles per Year", "3 (every ~4 months) across 4 zones"],
    ["Payment", "In arrears, on PPM completion"],
    ["Termination", "3 months written notice by either party"],
    ["Signed by MB", "Asst. Commercial Manager"],
    ["Signed by BEC", "Authorized Signatory"],
] as const;

export interface SlaTier {
    priority: string;
    responseTime: string;
    description: string;
    /** Token-backed tint class for the tile background. */
    bgClass: string;
    /** Token-backed dot class paired with the priority label. */
    dotClass: string;
}

/** Contractual response-time SLA. */
export const SLA_TIERS: readonly SlaTier[] = [
    { priority: "P1 Emergency", responseTime: "3 Hours", description: "Continuous alarm, pump failure, major leak", bgClass: "bg-mb-danger-light", dotClass: "bg-mb-danger" },
    { priority: "P2 Urgent", responseTime: "8 Hours", description: "Minor leak, panel malfunction, abnormal pump noise", bgClass: "bg-mb-warning-light", dotClass: "bg-mb-warning" },
    { priority: "P3 Normal", responseTime: "24 Hours", description: "Extinguisher refilling, general maintenance", bgClass: "bg-mb-info-light", dotClass: "bg-mb-info" },
    { priority: "P4 PPM", responseTime: "Per schedule", description: "Scheduled preventive maintenance", bgClass: "bg-muted dark:bg-muted/50", dotClass: "bg-muted-foreground" },
] as const;

export interface ScopeCount {
    label: string;
    value: string;
    detail: string;
}

/**
 * Asset counts named in the AMC scope. These are the CONTRACT's numbers, not a
 * live count — the live register is `fire_safety_equipment`.
 */
export const AMC_SCOPE_COUNTS: readonly ScopeCount[] = [
    { label: "FA Panels", value: "41", detail: "Menvier · Gent · Tyco" },
    { label: "Extinguishers", value: "~549", detail: "All areas" },
    { label: "Hydrants", value: "30", detail: "3 Staff + 27 External" },
    { label: "Hose Reels", value: "25", detail: "Bristol / NAFFCO" },
    { label: "Electric Pumps", value: "2", detail: "500 GPM + 50 GPM" },
    { label: "Diesel Pumps", value: "2", detail: "500 GPM + 50 GPM" },
    { label: "Jockey Pump", value: "1", detail: "13.5 kW NAFFCO" },
    { label: "Pump Make", value: "NAFFCO", detail: "All 5 pumps" },
] as const;

/** Contractual insurance limits. */
export const INSURANCE_COVERAGE: readonly (readonly [string, string])[] = [
    ["Owner's property (contractor negligence)", "RO 100,000"],
    ["Third-party property liability", "RO 250,000"],
    ["Workmen's compensation", "Covered under open policy"],
] as const;

export interface TankerAgreement {
    company: string;
    /** Role only — individual names and addresses are deliberately not stored here. */
    contactRole: string;
    contract: string;
    signed: string;
    status: string;
}

/**
 * Sewage-tanker discharge agreements (STP-related, listed on this page for
 * reference). Counterparty contact details are intentionally omitted; the FM
 * office holds them alongside the signed agreements.
 */
export const TANKER_DISCHARGE_RATE = {
    headline: "1 OMR per 1,000 Gallons",
    detail: "(5 OMR per standard 5,000-gal tanker)",
    basis: "Quantity based on each vehicle's marked tank capacity · Rate set by Commercial (Sep 2024)",
} as const;

export const TANKER_AGREEMENTS: readonly TankerAgreement[] = [
    { company: "Al Abraj", contactRole: "Contact held by FM office", contract: "Sewage Delivery Agreement 2026", signed: "Feb 2026 · Revised 11 Mar 2026", status: "Active" },
    { company: "Jomon's Company", contactRole: "Contact held by FM office", contract: "Sewage Delivery Agreement 2026", signed: "Feb 2026 · Revised 11 Mar 2026", status: "Active" },
] as const;
