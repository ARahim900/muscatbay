/**
 * @fileoverview Electricity Entities
 * Database models for electricity meters and readings
 * @module entities/electricity
 */

/**
 * Electricity meter from electricity_meters table
 */
export interface ElectricityMeter {
    id: string;
    name: string;
    meter_type: string;
    account_number: string | null;
    created_at?: string;
}

/**
 * Electricity reading from electricity_readings table
 */
export interface ElectricityReading {
    id: string;
    meter_id: string;
    month: string;
    // Nullable in the DB: a NULL reading means "closed / not in service" for that
    // month (distinct from a genuine 0 kWh), matching the electricity master
    // spreadsheet's rule "leave empty if not in service; only enter 0 for a true zero".
    consumption: number | null;
    created_at?: string;
}
