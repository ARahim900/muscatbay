/**
 * @fileoverview STP electricity — one row per OWATCO report month
 * (table `stp_electricity_monthly`). Every figure is `number | null`: a missing
 * report or bill stays null and its status says why — it is never 0.
 * @module entities/stp-electricity
 */

/** OWATCO monthly report status for the month. */
export type StpOwatcoStatus =
    | 'reported'
    | 'reported_discrepancy'
    | 'summary_only'
    | 'not_found'
    | 'not_received';

/** Nama bill status for the month. */
export type StpBilledStatus = 'billed' | 'unreliable' | 'not_available';

export interface StpElectricityMonth {
    /** First day of the report month, yyyy-MM-dd. */
    reportMonth: string;
    /** OWATCO cycle: 26th of the previous month … 25th of this month. */
    periodStart: string | null;
    periodEnd: string | null;
    /** kWh from OWATCO's monthly report. */
    owatcoKwh: number | null;
    owatcoStatus: StpOwatcoStatus;
    owatcoNote: string | null;
    /** kWh on Nama's bill for account R54460 (only where the bill's kWh is on file). */
    namaKwh: number | null;
    /** Nama bill before VAT, OMR. */
    billedOmr: number | null;
    billedStatus: StpBilledStatus;
    billedNote: string | null;
}

/** Row shape as stored. */
export interface SupabaseStpElectricityMonth {
    report_month: string;
    period_start: string | null;
    period_end: string | null;
    owatco_kwh: number | string | null;
    owatco_status: StpOwatcoStatus;
    owatco_note: string | null;
    nama_kwh: number | string | null;
    billed_omr: number | string | null;
    billed_status: StpBilledStatus;
    billed_note: string | null;
}
