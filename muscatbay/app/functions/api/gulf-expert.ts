/**
 * @fileoverview Gulf Expert (HVAC / BMS) data access.
 *
 * Every read goes through {@link fetchAllRows}, which pages the table with
 * PostgREST `.range()` instead of issuing one unbounded `.select()`.
 *
 * WHY: PostgREST enforces a server-side `max_rows` cap (1,000 by default) that
 * silently overrides a client `.limit()`. A single unbounded select therefore
 * returns the first 1,000 rows with no error and no signal — every KPI, chart
 * and table downstream is then computed over a truncated dataset that looks
 * complete. We page until the server returns a short page, and we ask for an
 * exact count so a run that hits the safety ceiling can be *reported* rather
 * than silently dropped.
 *
 * @module functions/api/gulf-expert
 */

import { type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase-client';
import type {
    PpmFinding,
    RecurringIssue,
    GulfExpertContract,
    GulfExpertCommunication,
} from '@/components/gulf-expert/types';

/** Rows requested per PostgREST round-trip (must be <= the server max_rows cap). */
const PAGE_SIZE = 1000;

/** Hard ceiling so a runaway table can never spin the browser forever. */
const MAX_ROWS = 20_000;

/** Explicit column lists — never `SELECT *`. */
const FINDINGS_COLS =
    'id, finding_code, equipment_id, building, system_type, equipment_label, fiscal_year, ppm_visit, description, quantity, priority, status, quotation_ref, action_required, contractor_notes, is_recurring, first_identified_ppm';
const RECURRING_COLS =
    'id, equipment_id, building, equipment_label, issue_type, first_ppm, last_ppm, occurrence_count, still_open, resolved_ppm, notes';
const CONTRACT_COLS =
    'id, contract_type, contract_ref, start_date, end_date, value_omr_excl_vat, value_omr_incl_vat, status, scope_summary, ppm_visits_per_year, emergency_visits_per_year, emergency_response_hours, notes';
const COMMUNICATION_COLS =
    'id, communication_date, direction, subject, from_person, summary, action_required, action_status, related_contract';

/**
 * A fully-paged read.
 *
 * `truncated` is the honesty flag: it is only ever true when the safety ceiling
 * stopped us short of `total`, and the UI is expected to surface it.
 */
export interface PagedResult<T> {
    rows: T[];
    /** Exact server-side row count for the table (not just what we fetched). */
    total: number;
    /** True when `rows.length < total` because MAX_ROWS was reached. */
    truncated: boolean;
}

const emptyResult = <T>(): PagedResult<T> => ({ rows: [], total: 0, truncated: false });

/**
 * Read an entire table through `.range()` pagination, ordered by `id` so page
 * boundaries are stable across round-trips.
 */
async function fetchAllRows<T>(
    client: SupabaseClient,
    table: string,
    columns: string,
): Promise<PagedResult<T>> {
    const rows: T[] = [];
    let total = 0;
    let offset = 0;

    while (offset < MAX_ROWS) {
        const { data, error, count } = await client
            .from(table)
            .select(columns, { count: 'exact' })
            .order('id', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            throw new Error(`Supabase error (${table}): ${error.message}`);
        }

        if (typeof count === 'number') total = count;

        const page = (data ?? []) as unknown as T[];
        rows.push(...page);

        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
    }

    // total can only be 0 here if the table is genuinely empty or the server
    // withheld the count; fall back to what we actually received.
    if (total < rows.length) total = rows.length;

    return { rows, total, truncated: rows.length < total };
}

export async function getPpmFindings(
    clientOverride?: SupabaseClient,
): Promise<PagedResult<PpmFinding>> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return emptyResult<PpmFinding>();
    return fetchAllRows<PpmFinding>(client, 'ge_ppm_findings', FINDINGS_COLS);
}

export async function getRecurringIssues(
    clientOverride?: SupabaseClient,
): Promise<PagedResult<RecurringIssue>> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return emptyResult<RecurringIssue>();
    return fetchAllRows<RecurringIssue>(client, 'ge_recurring_issues', RECURRING_COLS);
}

/**
 * AMC contracts (HVAC + BMS) — the live source for the Overview contract cards.
 * Previously these figures were typed into the component by hand.
 */
export async function getGulfExpertContracts(
    clientOverride?: SupabaseClient,
): Promise<PagedResult<GulfExpertContract>> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return emptyResult<GulfExpertContract>();
    return fetchAllRows<GulfExpertContract>(client, 'gulf_expert_contracts', CONTRACT_COLS);
}

/**
 * Correspondence log. Rows carrying an `action_required` with an open
 * `action_status` are what the Overview "Open Actions" panel lists —
 * identification only, no assignment or close-out workflow.
 */
export async function getGulfExpertCommunications(
    clientOverride?: SupabaseClient,
): Promise<PagedResult<GulfExpertCommunication>> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return emptyResult<GulfExpertCommunication>();
    return fetchAllRows<GulfExpertCommunication>(
        client,
        'gulf_expert_communications',
        COMMUNICATION_COLS,
    );
}

/** Tables the HVAC page subscribes to for realtime refresh. */
export const GULF_EXPERT_REALTIME_TABLES = [
    'ge_ppm_findings',
    'ge_recurring_issues',
    'gulf_expert_contracts',
    'gulf_expert_communications',
] as const;
