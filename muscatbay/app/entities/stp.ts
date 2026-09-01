/**
 * @fileoverview STP Operations Entity
 * Database model and transform function for stp_operations table
 * @module entities/stp
 */

import type { STPOperation } from '@/lib/mock-data';
import { nullableFiniteNumber } from '@/lib/stp-data-quality';

/**
 * STP operation record from stp_operations table
 */
export interface SupabaseSTPOperation {
    id: number;
    date: string;
    inlet_sewage: number | null;
    tse_for_irrigation: number | null;
    tanker_trips: number | null;
    generated_income: number | null;
    water_savings: number | null;
    total_impact: number | null;
    monthly_volume_input: number | null;
    monthly_volume_output: number | null;
    monthly_income: number | null;
    monthly_savings: number | null;
    original_id: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Transform Supabase STP record to match the app's STPOperation interface
 */
export function transformSTPOperation(dbRecord: SupabaseSTPOperation): STPOperation {
    return {
        id: String(dbRecord.id),
        date: dbRecord.date,
        inlet_sewage: nullableFiniteNumber(dbRecord.inlet_sewage),
        tse_for_irrigation: nullableFiniteNumber(dbRecord.tse_for_irrigation),
        tanker_trips: nullableFiniteNumber(dbRecord.tanker_trips),
        generated_income: dbRecord.generated_income != null ? Number(dbRecord.generated_income) : undefined,
        water_savings: dbRecord.water_savings != null ? Number(dbRecord.water_savings) : undefined,
        total_impact: dbRecord.total_impact != null ? Number(dbRecord.total_impact) : undefined,
    };
}
