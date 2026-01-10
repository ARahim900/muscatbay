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
    consumption: number;
    created_at?: string;
}
