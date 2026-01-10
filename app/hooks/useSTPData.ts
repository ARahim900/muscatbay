"use client";

import { useState, useEffect, useCallback } from "react";
import { getSTPOperations, STPOperation } from "@/lib/mock-data";
import { getSTPOperationsFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { STP_RATES } from "@/lib/config";
import { useToast } from "@/components/ui/toast-provider";

/**
 * Return type for the useSTPData hook
 */
interface UseSTPDataReturn {
    operations: STPOperation[];
    loading: boolean;
    error: Error | null;
    isLiveData: boolean;
    refetch: () => Promise<void>;
    stats: {
        totalInlet: number;
        totalTSE: number;
        totalTrips: number;
        generatedIncome: number;
        waterSavings: number;
        totalEconomicImpact: number;
        treatmentEfficiency: number;
        dailyAverageInlet: number;
    };
}

/**
 * Custom hook for fetching and managing STP plant data.
 * Handles Supabase integration, fallback to mock data, and error notifications.
 */
export function useSTPData(): UseSTPDataReturn {
    const [operations, setOperations] = useState<STPOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isLiveData, setIsLiveData] = useState(false);
    const toast = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Try Supabase first
            if (isSupabaseConfigured()) {
                try {
                    const supabaseData = await getSTPOperationsFromSupabase();
                    if (supabaseData.length > 0) {
                        setOperations(supabaseData);
                        setIsLiveData(true);
                        toast.success("Data loaded", "Connected to live database");
                        return;
                    }
                } catch (supabaseError) {
                    // Log but don't throw - fall back to mock data
                    console.warn("Supabase fetch failed, falling back to mock data:", supabaseError);
                    toast.warning("Using demo data", "Could not connect to live database");
                }
            }

            // Fall back to mock data
            const result = await getSTPOperations();
            setOperations(result);
            setIsLiveData(false);
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Failed to load STP data");
            setError(error);
            toast.error("Failed to load data", error.message);

            // Still try to load mock data as absolute fallback
            try {
                const result = await getSTPOperations();
                setOperations(result);
                setIsLiveData(false);
            } catch {
                // Complete failure
                setOperations([]);
            }
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate statistics
    const stats = {
        totalInlet: operations.reduce((sum, op) => sum + op.inlet_sewage, 0),
        totalTSE: operations.reduce((sum, op) => sum + op.tse_for_irrigation, 0),
        totalTrips: operations.reduce((sum, op) => sum + op.tanker_trips, 0),
        generatedIncome: 0,
        waterSavings: 0,
        totalEconomicImpact: 0,
        treatmentEfficiency: 0,
        dailyAverageInlet: 0,
    };

    stats.generatedIncome = stats.totalTrips * STP_RATES.TANKER_FEE;
    stats.waterSavings = stats.totalTSE * STP_RATES.TSE_SAVING_RATE;
    stats.totalEconomicImpact = stats.generatedIncome + stats.waterSavings;
    stats.treatmentEfficiency = stats.totalInlet > 0 ? (stats.totalTSE / stats.totalInlet) * 100 : 0;
    stats.dailyAverageInlet = operations.length > 0 ? stats.totalInlet / operations.length : 0;

    return {
        operations,
        loading,
        error,
        isLiveData,
        refetch: fetchData,
        stats,
    };
}
