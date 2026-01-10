/**
 * @fileoverview Fire Safety Entities
 * Type definitions for fire safety equipment and quotations
 * @module entities/fire-safety
 */

/**
 * Fire safety equipment record
 */
export interface FireSafetyEquipment {
    id: string;
    name: string;
    location: string;
    status: "Operational" | "Needs Attention" | "Expired" | "Maintenance Due";
    priority: "Critical" | "High" | "Medium" | "Low";
    battery: number | null;
    signal: number | null;
    next_maintenance: string;
    inspector: string;
    type: string;
    zone: string;
}

/**
 * Fire quotation summary
 */
export interface FireQuotation {
    id: string;
    quote_code: string;
    date: string;
    provider: string;
    status: "draft" | "pending_approval" | "approved" | "rejected";
    subtotal_omr: number;
    vat_omr: number;
    total_omr: number;
}

/**
 * Fire quotation line item
 */
export interface FireQuotationItem {
    id: string;
    quote_code: string;
    location: string;
    description: string;
    category: string;
    priority: "high" | "medium" | "low";
    cost_omr: number;
}
