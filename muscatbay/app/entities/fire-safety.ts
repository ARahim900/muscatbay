/**
 * @fileoverview Fire Safety Entities
 * Type definitions for fire safety equipment, the BEC PPM programme,
 * issues register and contacts.
 *
 * NOTE: quotations are referenced only by the `quote_ref` text column on
 * FireIssue. There is no quotation type here because no API or UI in this app
 * reads one.
 * @module entities/fire-safety
 */

/**
 * Fire safety equipment record — maps to public.fire_safety_equipment
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
 * BEC PPM activity-log entry — maps to public.fire_ppm_activities.
 * A chronological record of every PPM cycle, inspection, quote and
 * contract milestone in the BEC engagement.
 */
export interface FirePpmActivity {
    id: string;
    ppm_period: string;
    start_date: string | null;
    end_date: string | null;
    activity_type: string;
    scope: string;
    bec_contact: string | null;
    bec_email: string | null;
    status: string;
    thread_ref: string | null;
    notes: string | null;
}

/**
 * Fire system defect / issue — maps to public.fire_issues_register.
 */
export interface FireIssue {
    id: string;
    date_reported: string | null;
    issue_description: string;
    location: string;
    reported_by: string | null;
    quote_ref: string | null;
    status: string;
    resolution: string | null;
}

/**
 * BEC FMM team contact — maps to public.fire_ppm_contacts.
 */
export interface FirePpmContact {
    id: string;
    name: string;
    role: string;
    email: string | null;
    phone: string | null;
    active_period: string | null;
}
