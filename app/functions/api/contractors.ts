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
    transformContractor
} from '@/entities/contractor';
import type { Contractor } from '@/lib/mock-data';

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
        .select('*')
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
        .select('*')
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
        .select('*')
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
        .select('*')
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
        .select('*')
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
        .select('*')
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
        .select('*, amc_contracts(name, company)')
        .order('expiry_date');

    if (error) {
        return [];
    }
    return data || [];
}

export async function getAmcContacts(): Promise<AmcContact[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_contacts')
        .select('*, amc_contracts(name)')
        .order('contact_name');

    if (error) {
        return [];
    }
    return data || [];
}

export async function getAmcPricing(): Promise<AmcPricing[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('amc_pricing')
        .select('*, amc_contracts(name)')
        .order('contract_value', { ascending: false });

    if (error) {
        return [];
    }
    return data || [];
}
