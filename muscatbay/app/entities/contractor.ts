/**
 * @fileoverview Contractor Entities
 * Database models for contractor tracking and AMC tables
 * @module entities/contractor
 */

import type { Contractor } from '@/lib/mock-data';

// =============================================================================
// AMC REGISTER — the sole active AMC source (ACT-012, 04-Aug-2026)
// =============================================================================

/**
 * A row of `amc_register`, built from the Muscat Bay AMC Contract Register
 * (evidence review 04-Aug-2026). This replaced `Contractor_Tracker` as the
 * authoritative source.
 *
 * The nullability here is the whole point and must be preserved end-to-end:
 * **a null fee or date means "not evidenced", never zero.** The evidence review
 * could substantiate exactly one fee (KONE, and even that is `Conflicting`), so
 * ten of these rows carry nulls that the UI must render as "—". The legacy
 * tables asserted precise figures for all of them — e.g. National Marine at
 * 57,093.12/yr while no formal contract exists at all — which is exactly the
 * fabricated-confidence failure the non-negotiables in CLAUDE.md forbid.
 */
export interface AmcRegister {
    agreement_id: string;
    contractor: string;
    service_system: string;
    engagement_type: string | null;
    contract_ref: string | null;
    current_status: string | null;
    /** ISO `YYYY-MM-DD` from PostgREST, or null when never evidenced. */
    start_date: string | null;
    end_date: string | null;
    monthly_fee_omr: number | null;
    annual_fee_omr: number | null;
    total_value_omr: number | null;
    vat_basis: string | null;
    /** Evidence strength — `Conflicting` and `No formal contract` are warnings. */
    verification: string | null;
    document_status: string | null;
    evidence_anchor: string | null;
    key_note: string | null;
    required_action: string | null;
    sort_order: number | null;
}

/** OMR renders to 3 decimals per the brand framework; null stays null. */
function omr(value: number | null): string | null {
    if (value === null || value === undefined) return null;
    return `${value.toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    })} OMR`;
}

/**
 * Adapt an `amc_register` row to the legacy `ContractorTracker` shape.
 *
 * The AMC Tracker grid, its export, sort, filter and the renewals panel are all
 * written against `ContractorTracker` across ~35 call sites. Mapping at this one
 * boundary repoints every consumer to the register without a risky rewrite of
 * `app/contractors/page.tsx`, and keeps `AmcRegister` as the typed source for
 * anything built from here on.
 *
 * Nulls are passed straight through — never coerced to 0 or "" — so an
 * unevidenced fee reaches the grid as "—" rather than a confident-looking zero.
 */
export function toTrackerRow(row: AmcRegister): ContractorTracker {
    return {
        // The register's own primary key. Carried through so an alert incident
        // can be keyed to the agreement itself rather than to the contractor's
        // display name, which changes with a rename and is not unique when one
        // contractor holds several agreements.
        agreement_id: row.agreement_id,
        Contractor: row.contractor,
        "Service Provided": row.service_system,
        Status: row.current_status,
        "Contract Type": row.engagement_type,
        "Start Date": row.start_date,
        "End Date": row.end_date,
        "Contract (OMR)/Month": omr(row.monthly_fee_omr),
        "Contract Total (OMR)/Year": omr(row.annual_fee_omr),
        "Annual Value (OMR)": row.annual_fee_omr,
        // The register's required action is the documented renewal/evidence step.
        // It carries no owner, due date or status — surfacing a recorded fact,
        // not resolution tracking (CLAUDE.md non-negotiable 2).
        "Renewal Plan": row.required_action,
        Note: row.key_note,
        contract_pdf_url: null,
    };
}

/**
 * Legacy shape of the `Contractor_Tracker` table.
 *
 * @deprecated As a *data source*. The table is a read-only audit snapshot since
 * 04-Aug-2026 and holds figures the AMC evidence review could not substantiate.
 * The interface itself is still the grid's view model — populate it from
 * {@link toTrackerRow}, never from `Contractor_Tracker` directly.
 */
export interface ContractorTracker {
    /**
     * `amc_register.agreement_id` — the register's stable identity for the
     * agreement. Optional because the legacy `Contractor_Tracker` snapshot has
     * no equivalent column; consumers that need a durable key must handle null
     * rather than fall back to a name.
     */
    agreement_id?: string | null;
    Contractor: string | null;
    "Service Provided": string | null;
    Status: string | null;
    "Contract Type": string | null;
    "Start Date": string | null;
    "End Date": string | null;
    "Contract (OMR)/Month": string | null;
    "Contract Total (OMR)/Year": string | null;
    "Annual Value (OMR)": number | null;
    "Renewal Plan": string | null;
    Note: string | null;
    contract_pdf_url?: string | null;
}

// =============================================================================
// CONTRACTOR CONTRACTS (New Schema — 14 active contracts)
// =============================================================================

export interface ContractorContract {
    id: number;
    contractor: string;
    contract_ref: string | null;
    service: string | null;
    flow: 'Expense' | 'Revenue';
    status: string;
    contract_years: number | null;
    annual_value_omr: number | null;
    total_value_omr: number | null;
    rate_note: string | null;
    note: string | null;
    contract_pdf_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ContractorYearlyCost {
    id: number;
    contractor: string;
    contract_year: number;
    year_label: string;
    amount_omr: number | null;
    created_at?: string;
    updated_at?: string;
}

// =============================================================================
// AMC CONTRACTOR INTERFACES (New Schema)
// =============================================================================

export interface AmcContractorSummary {
    id: string;
    no: number;
    contractor: string;
    service_category: string | null;
    contract_ref: string | null;
    contract_type: string | null;
    start_date: string | null;
    end_date: string | null;
    duration: string | null;
    monthly_fee_omr: string | null;
    annual_fee_omr: string | null;
    total_contract_value_omr: string | null;
    status: string | null;
    alert: string | null;
    document_status: string | null;
    created_at?: string;
}

export interface AmcContractorDetails {
    id: string;
    contractor: string;
    contract_ref: string | null;
    scope_of_work: string | null;
    ppm_frequency: string | null;
    response_time_emergency: string | null;
    response_time_normal: string | null;
    liquidated_damages: string | null;
    performance_bond: string | null;
    payment_terms: string | null;
    warranty_period: string | null;
    key_exclusions: string | null;
    contact_person: string | null;
    created_at?: string;
}

export interface AmcContractorExpiry {
    id: string;
    contractor: string;
    end_date: string | null;
    days_remaining: number | null;
    renewal_action_required_by: string | null;
    priority: string | null;
    renewal_status: string | null;
    created_at?: string;
}

export interface AmcContractorPricing {
    id: string;
    contractor: string;
    year_1_omr: string | null;
    year_2_omr: string | null;
    year_3_omr: string | null;
    year_4_omr: string | null;
    year_5_omr: string | null;
    total_omr: string | null;
    notes: string | null;
    created_at?: string;
}

// =============================================================================
// LEGACY INTERFACES
// =============================================================================

/**
 * Transform AMC summary to app's Contractor interface
 */
export function transformContractor(item: AmcContractorSummary): Contractor {
    return {
        id: item.id,
        name: item.contractor,
        company: item.contractor,
        status: (item.status as Contractor['status']) || 'Active',
        expiryDate: item.end_date || '',
        category: item.service_category || ''
    };
}
