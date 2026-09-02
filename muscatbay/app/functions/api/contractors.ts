/**
 * @fileoverview Contractors API Functions
 * Data fetching functions for contractors from Supabase
 * @module functions/api/contractors
 */

import { getSupabaseClient } from '../supabase-client';
import {
    ContractorTracker,
    ContractorContract,
    ContractorYearlyCost,
    AmcRegister,
    AmcContractorSummary,
    AmcContractorDetails,
    AmcContractorExpiry,
    AmcContractorPricing,
    toTrackerRow,
    transformContractor
} from '@/entities/contractor';
import type { Contractor } from '@/lib/mock-data';

/**
 * Read failures throw instead of resolving to `[]`.
 *
 * An empty array is a legitimate answer ("no contracts recorded yet") and the
 * UI says so; swallowing a query error into the same shape made a broken load
 * indistinguishable from an empty database. Callers that must not fail hard
 * (e.g. the dashboard alert hook) already use `Promise.allSettled`.
 */
function failed(context: string, message: string): never {
    throw new Error(`${context}: ${message}`);
}

// =============================================================================
// CONTRACTOR CONTRACTS API (contractor_contracts + contractor_yearly_costs)
// =============================================================================

/**
 * Fetch all contracts from contractor_contracts table
 */
export async function getContractorContracts(): Promise<ContractorContract[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('contractor_contracts')
        .select('id, contractor, contract_ref, service, flow, status, contract_years, annual_value_omr, total_value_omr, rate_note, note, contract_pdf_url, created_at')
        .order('flow')
        .order('contractor');

    if (error) failed('Unable to load contracts', error.message);
    return (data as ContractorContract[]) || [];
}

/**
 * Fetch all yearly cost breakdowns from contractor_yearly_costs table
 */
export async function getContractorYearlyCosts(): Promise<ContractorYearlyCost[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('contractor_yearly_costs')
        .select('id, contractor, contract_year, year_label, amount_omr, created_at')
        .order('contract_year')
        .order('contractor');

    if (error) failed('Unable to load yearly costs', error.message);
    return (data as ContractorYearlyCost[]) || [];
}

/** Result of a contract-document write — carries the reason so the UI can show it. */
export interface ContractPdfUpdateResult {
    ok: boolean;
    error?: string;
}

/**
 * Update the contract_pdf_url for a contractor contract.
 * Returns the failure reason rather than only logging it, so the dialog can
 * never look like it saved when it did not.
 */
export async function updateContractPdfUrl(id: number, pdfUrl: string | null): Promise<ContractPdfUpdateResult> {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: 'Not connected to the database.' };

    const { error } = await client
        .from('contractor_contracts')
        .update({ contract_pdf_url: pdfUrl })
        .eq('id', id);

    if (error) {
        console.error('Error updating contract_pdf_url:', error.message);
        return { ok: false, error: error.message };
    }
    return { ok: true };
}

// =============================================================================
// NEW CONTRACTOR TRACKER API
// =============================================================================

const AMC_REGISTER_COLUMNS =
    'agreement_id, contractor, service_system, engagement_type, contract_ref, current_status, ' +
    'start_date, end_date, monthly_fee_omr, annual_fee_omr, total_value_omr, vat_basis, ' +
    'verification, document_status, evidence_anchor, key_note, required_action, sort_order';

/**
 * Fetch the AMC register — the sole active AMC source since 04-Aug-2026 (ACT-012).
 *
 * Ordered by `sort_order` so the app presents AMC-001…010 in the same sequence
 * as the signed register, which is how Rahim and Commercial read it.
 */
export async function getAmcRegister(): Promise<AmcRegister[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_register')
        .select(AMC_REGISTER_COLUMNS)
        .order('sort_order')
        .returns<AmcRegister[]>();

    if (error) failed('Unable to load the AMC register', error.message);
    return data || [];
}

/**
 * AMC tracker rows for the contractors grid, the dashboard and the alert hook.
 *
 * Reads `amc_register` and adapts each row to the grid's legacy view model.
 * It no longer touches the `Contractor_Tracker` table, which became a read-only
 * audit snapshot on 04-Aug-2026 because it asserted fees the AMC evidence review
 * could not substantiate (National Marine shown Active at 57,093.12/yr with no
 * formal contract in place; Muscat Electronics at 10,461.84/yr against a 1,071
 * proposal for an AMC that expired 02-Jun-2026).
 *
 * The old dedup pass is gone with it: `amc_register.agreement_id` is the primary
 * key and each of AMC-001…010 is a distinct agreement, so duplicates cannot
 * arise. Gulf Expert legitimately holds two rows (HVAC and BMS) — the previous
 * (Contractor, Service Provided) dedup would have been wrong to collapse them
 * and correctly did not, but the constraint now makes the question moot.
 */
export async function getContractorTrackerData(): Promise<ContractorTracker[]> {
    const rows = await getAmcRegister();
    return rows.map(toTrackerRow);
}

// =============================================================================
// AMC FETCH FUNCTIONS (New Schema)
// =============================================================================

export async function getContractorSummary(): Promise<AmcContractorSummary[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_summary')
        .select('id, no, contractor, service_category, contract_ref, contract_type, start_date, end_date, duration, monthly_fee_omr, annual_fee_omr, total_contract_value_omr, status, alert, document_status')
        .order('no');

    if (error) {
        console.error('Error fetching amc_contractor_summary:', error.message);
        return [];
    }
    return data || [];
}

/**
 * Count contractors in amc_contractor_summary without fetching any rows.
 * `head: true` makes Supabase return only the exact counts — no data transfer.
 * Returns both the total row count and the count of Active-status contractors.
 *
 * The active filter is a prefix match, not equality. Since the view began
 * reporting the AMC register's own status wording, "Active" is only one of
 * several live values — "Active — terms partial" and "Active — term conflict"
 * are equally active, just short of full evidence. An `.eq('Active')` would
 * count 3 of the 8 engaged agreements and quietly under-report the deck.
 */
export async function getContractorCounts(): Promise<{ total: number; active: number }> {
    const client = getSupabaseClient();
    if (!client) return { total: 0, active: 0 };

    const [totalRes, activeRes] = await Promise.all([
        client.from('amc_contractor_summary').select('id', { count: 'exact', head: true }),
        client.from('amc_contractor_summary').select('id', { count: 'exact', head: true }).ilike('status', 'Active%'),
    ]);

    if (totalRes.error) {
        console.error('Error counting amc_contractor_summary:', totalRes.error.message);
        return { total: 0, active: 0 };
    }
    if (activeRes.error) {
        console.error('Error counting active amc_contractor_summary:', activeRes.error.message);
        return { total: 0, active: 0 };
    }

    return { total: totalRes.count || 0, active: activeRes.count || 0 };
}

export async function getContractorDetails(): Promise<AmcContractorDetails[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_details')
        .select('id, contractor, contract_ref, scope_of_work, ppm_frequency, response_time_emergency, response_time_normal, liquidated_damages, performance_bond, payment_terms, warranty_period, key_exclusions, contact_person')
        .order('contractor');

    if (error) failed('Unable to load contract terms', error.message);
    return data || [];
}

export async function getContractorExpiry(): Promise<AmcContractorExpiry[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_expiry')
        .select('id, contractor, end_date, days_remaining, renewal_action_required_by, priority, renewal_status')
        .order('days_remaining');

    if (error) failed('Unable to load contract expiry', error.message);
    return data || [];
}

export async function getContractorPricing(): Promise<AmcContractorPricing[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_pricing')
        .select('id, contractor, year_1_omr, year_2_omr, year_3_omr, year_4_omr, year_5_omr, total_omr, notes')
        .order('contractor');

    if (error) failed('Unable to load contract pricing', error.message);
    return data || [];
}

/**
 * Combined fetch for the main view using new schema
 */
export async function getCombinedContractors(): Promise<Contractor[]> {
    const summaryData = await getContractorSummary();
    return summaryData.map(transformContractor);
}
