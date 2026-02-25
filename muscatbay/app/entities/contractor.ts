/**
 * @fileoverview Contractor Entities
 * Database models for contractor tracking and AMC tables
 * @module entities/contractor
 */

import type { Contractor } from '@/lib/mock-data';

/**
 * New unified schema for Contractor_Tracker table
 */
export interface ContractorTracker {
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
// LEGACY AMC INTERFACES (Backward Compatibility)
// =============================================================================

export interface AmcContract {
    id: string;
    name: string;
    company: string | null;
    category: string;
    status: string;
    start_date: string | null;
    created_at?: string;
}

export interface AmcExpiry {
    id: string;
    contract_id: string;
    expiry_date: string;
    notification_sent: boolean;
    amc_contracts?: AmcContract;
}

export interface AmcContact {
    id: string;
    contract_id: string;
    contact_name: string;
    role: string | null;
    phone: string | null;
    email: string | null;
    amc_contracts?: AmcContract;
}

export interface AmcPricing {
    id: string;
    contract_id: string;
    contract_value: number;
    currency: string;
    payment_terms: string | null;
    amc_contracts?: AmcContract;
}

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
