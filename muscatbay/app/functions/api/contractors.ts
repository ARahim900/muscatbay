/**
 * @fileoverview Contractors API Functions
 * Data fetching functions for contractors from Supabase
 * @module functions/api/contractors
 */

import { getSupabaseClient } from '../supabase-client';
import {
    ContractorTracker,
    AmcContractorSummary,
    AmcContractorDetails,
    AmcContractorExpiry,
    AmcContractorPricing,
    AmcContract,
    AmcExpiry,
    AmcContact,
    AmcPricing,
    ContractorContract,
    ContractorYearlyCost,
    transformContractor
} from '@/entities/contractor';
import type { Contractor } from '@/lib/mock-data';

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
        .select('id, contractor, contract_ref, service, flow, status, contract_years, annual_value_omr, total_value_omr, rate_note, note, created_at')
        .order('flow')
        .order('contractor');

    if (error) {
        console.error('Error fetching contractor_contracts:', error.message);
        return [];
    }
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

    if (error) {
        console.error('Error fetching contractor_yearly_costs:', error.message);
        return [];
    }
    return (data as ContractorYearlyCost[]) || [];
}

// =============================================================================
// NEW CONTRACTOR TRACKER API
// =============================================================================

/**
 * Fetch all contractor tracker data from Supabase
 */
export async function getContractorTrackerData(): Promise<ContractorTracker[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('Contractor_Tracker')
        .select('"Contractor", "Service Provided", "Status", "Contract Type", "Start Date", "End Date", "Contract (OMR)/Month", "Contract Total (OMR)/Year", "Annual Value (OMR)", "Renewal Plan", "Note"')
        .order('Contractor');

    if (error) {
        console.error('Error fetching Contractor_Tracker:', error.message);
        return [];
    }
    return data || [];
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
        return [];
    }
    return data || [];
}

export async function getContractorDetails(): Promise<AmcContractorDetails[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_details')
        .select('id, contractor, contract_ref, scope_of_work, ppm_frequency, response_time_emergency, response_time_normal, liquidated_damages, performance_bond, payment_terms, warranty_period, key_exclusions, contact_person')
        .order('contractor');

    if (error) {
        console.error('Error fetching contractor details:', error);
        return [];
    }
    return data || [];
}

export async function getContractorExpiry(): Promise<AmcContractorExpiry[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_expiry')
        .select('id, contractor, end_date, days_remaining, renewal_action_required_by, priority, renewal_status')
        .order('days_remaining');

    if (error) {
        console.error('Error fetching contractor expiry:', error);
        return [];
    }
    return data || [];
}

export async function getContractorPricing(): Promise<AmcContractorPricing[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contractor_pricing')
        .select('id, contractor, year_1_omr, year_2_omr, year_3_omr, year_4_omr, year_5_omr, total_omr, notes')
        .order('contractor');

    if (error) {
        return [];
    }
    return data || [];
}

/**
 * Combined fetch for the main view using new schema
 */
export async function getCombinedContractors(): Promise<Contractor[]> {
    const summaryData = await getContractorSummary();
    return summaryData.map(transformContractor);
}

// =============================================================================
// LEGACY FETCH FUNCTIONS (Backward Compatibility)
// =============================================================================

export async function getAmcContracts(): Promise<AmcContract[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contracts')
        .select('id, name, company, category, status, start_date')
        .order('name');

    if (error) {
        return [];
    }
    return data || [];
}

export async function getAmcExpiry(): Promise<AmcExpiry[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_expiry')
        .select('id, contract_id, expiry_date, notification_sent, amc_contracts(name, company)')
        .order('expiry_date');

    if (error) {
        return [];
    }
    return (data as unknown as AmcExpiry[]) || [];
}

export async function getAmcContacts(): Promise<AmcContact[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contacts')
        .select('id, contract_id, contact_name, role, phone, email, amc_contracts(name)')
        .order('contact_name');

    if (error) {
        return [];
    }
    return (data as unknown as AmcContact[]) || [];
}

export async function getAmcPricing(): Promise<AmcPricing[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_pricing')
        .select('id, contract_id, contract_value, currency, payment_terms, amc_contracts(name)')
        .order('contract_value', { ascending: false });

    if (error) {
        return [];
    }
    return (data as unknown as AmcPricing[]) || [];
}
