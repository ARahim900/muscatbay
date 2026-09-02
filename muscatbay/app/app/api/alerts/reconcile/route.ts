import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import type { STPOperation } from "@/lib/mock-data";
import type { WaterMeter } from "@/lib/water-data";
import type { ContractorTracker } from "@/entities/contractor";
import { toTrackerRow } from "@/entities/contractor";
import { transformSTPOperation, type SupabaseSTPOperation } from "@/entities/stp";
import { getAmcRegister } from "@/functions/api/contractors";
import { getGulfExpertContractDateReconciliation } from "@/functions/api/gulf-expert";
import { fetchWaterMeters } from "@/functions/api/water";
import { evaluateOperationalAlertsWithCoverage } from "@/lib/operational-alerts";
import type { ContractDateReconciliation } from "@/lib/contract-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STP_COLUMNS = "id, date, inlet_sewage, tse_for_irrigation, tanker_trips, generated_income, water_savings, total_impact, monthly_volume_input, monthly_volume_output, monthly_income, monthly_savings, original_id";

interface EvaluationSources {
    waterMeters: WaterMeter[] | null;
    contractors: ContractorTracker[] | null;
    contractDates: ContractDateReconciliation | null;
    stpOperations: STPOperation[] | null;
}

function isAuthorized(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;
    return Boolean(cronSecret) && request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function evaluate(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("[alerts/reconcile] Server Supabase credentials are not configured.");
        return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const sources: EvaluationSources = {
        waterMeters: null,
        contractors: null,
        contractDates: null,
        stpOperations: null,
    };
    const failures: Record<string, string> = {};

    const [waterResult, contractorResult, stpResult] = await Promise.allSettled([
        fetchWaterMeters(client),
        Promise.all([
            getAmcRegister(client),
            getGulfExpertContractDateReconciliation(client),
        ]),
        client
            .from("stp_operations")
            .select(STP_COLUMNS)
            .order("date", { ascending: false })
            .limit(1500),
    ]);

    if (waterResult.status === "fulfilled" && !waterResult.value.error && waterResult.value.meters.length > 0) {
        sources.waterMeters = waterResult.value.meters;
    } else {
        failures.water = waterResult.status === "rejected"
            ? errorMessage(waterResult.reason)
            : waterResult.value.error ?? "No water meter rows returned";
    }

    if (contractorResult.status === "fulfilled" && contractorResult.value[0].length > 0) {
        sources.contractors = contractorResult.value[0].map(toTrackerRow);
        sources.contractDates = contractorResult.value[1];
    } else {
        failures.contractors = contractorResult.status === "rejected"
            ? errorMessage(contractorResult.reason)
            : "No contractor rows returned";
    }

    if (stpResult.status === "fulfilled" && !stpResult.value.error && (stpResult.value.data?.length ?? 0) > 0) {
        sources.stpOperations = (stpResult.value.data as SupabaseSTPOperation[]).map(transformSTPOperation);
    } else {
        failures.stp = stpResult.status === "rejected"
            ? errorMessage(stpResult.reason)
            : stpResult.value.error?.message ?? "No STP rows returned";
    }

    const { alerts, evaluatedModules, resolvableModules, withheldResolution } =
        evaluateOperationalAlertsWithCoverage({
            waterMeters: sources.waterMeters,
            contractors: sources.contractors,
            contractDateReconciliation: sources.contractDates,
            stpOperations: sources.stpOperations,
            now: new Date(),
        });

    if (evaluatedModules.length === 0) {
        console.error("[alerts/reconcile] No source could be evaluated:", failures);
        return NextResponse.json({ error: "No operational source could be evaluated", failures }, { status: 503 });
    }

    // Two distinct grants. Every alert raised is persisted for the modules we
    // READ; only modules whose evidence was COMPLETE may close incidents whose
    // condition is now absent. A module that returned sparse rows still gets its
    // data-quality alert recorded — it just cannot claim anything is fixed.
    const { error: reconcileError } = await client.rpc("reconcile_operational_alert_incidents", {
        p_alerts: alerts,
        p_evaluated_modules: evaluatedModules,
        p_resolvable_modules: resolvableModules,
    });

    if (reconcileError) {
        console.error("[alerts/reconcile] Incident reconciliation failed:", reconcileError.message);
        return NextResponse.json({ error: "Incident reconciliation failed" }, { status: 500 });
    }

    if (Object.keys(failures).length > 0) {
        console.warn("[alerts/reconcile] Completed with unavailable sources:", failures);
    }
    if (Object.keys(withheldResolution).length > 0) {
        console.warn("[alerts/reconcile] Resolution withheld on incomplete evidence:", withheldResolution);
    }
    return NextResponse.json({
        evaluatedModules,
        resolvableModules,
        withheldResolution,
        activeAlertCount: alerts.length,
        unavailableModules: Object.keys(failures),
    });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    return evaluate(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return evaluate(request);
}
