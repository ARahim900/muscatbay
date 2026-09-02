/**
 * The reconcile route is where evidence quality becomes a database grant, so
 * it is where a mistake silently closes real incidents. These tests pin the
 * contract with `reconcile_operational_alert_incidents`:
 *
 *  - resolution authority is a SUBSET of what was read, never equal to it by
 *    default;
 *  - a module read on incomplete evidence still gets its alerts persisted.
 */

// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AmcRegister } from "@/entities/contractor";

const rpc = vi.fn().mockResolvedValue({ error: null });
const from = vi.fn();
const fetchWaterMeters = vi.fn();
const getAmcRegister = vi.fn();
const getGulfExpertContractDateReconciliation = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({ rpc, from }),
}));
vi.mock("@/functions/api/water", () => ({
    fetchWaterMeters: (...args: unknown[]) => fetchWaterMeters(...args),
}));
vi.mock("@/functions/api/contractors", () => ({
    getAmcRegister: (...args: unknown[]) => getAmcRegister(...args),
}));
vi.mock("@/functions/api/gulf-expert", () => ({
    getGulfExpertContractDateReconciliation: (...args: unknown[]) =>
        getGulfExpertContractDateReconciliation(...args),
}));

const CRON_SECRET = "test-secret";

function request(authorization: string | null = `Bearer ${CRON_SECRET}`): Request {
    return new Request("https://example.test/api/alerts/reconcile", {
        headers: authorization ? { authorization } : {},
    });
}

/** An `stp_operations` select that resolves to the given rows. */
function stpRows(rows: Array<Record<string, unknown>>) {
    return {
        select: () => ({
            order: () => ({
                limit: () => Promise.resolve({ data: rows, error: null }),
            }),
        }),
    };
}

function amcRow(partial: Partial<AmcRegister>): AmcRegister {
    return {
        agreement_id: "AMC-1",
        contractor: "Test Co",
        service_system: "Testing",
        engagement_type: null,
        contract_ref: null,
        current_status: "Active",
        start_date: "2024-01-01",
        end_date: "2030-01-01",
        monthly_fee_omr: null,
        annual_fee_omr: null,
        total_value_omr: null,
        vat_basis: null,
        verification: null,
        document_status: null,
        evidence_anchor: null,
        key_note: null,
        required_action: null,
        sort_order: null,
        ...partial,
    };
}

async function callRoute() {
    const { POST } = await import("@/app/api/alerts/reconcile/route");
    // The route's NextRequest parameter only reads `headers`, which a plain
    // Request satisfies — constructing a NextRequest would drag the Next
    // server runtime into a unit test for no added coverage.
    return POST(request() as never);
}

beforeEach(() => {
    vi.resetModules();
    rpc.mockClear().mockResolvedValue({ error: null });
    process.env.CRON_SECRET = CRON_SECRET;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    fetchWaterMeters.mockResolvedValue({ meters: [], error: null });
    getAmcRegister.mockResolvedValue([]);
    getGulfExpertContractDateReconciliation.mockResolvedValue({ contracts: [], unreferenced: [] });
    from.mockReturnValue(stpRows([]));
});

describe("POST /api/alerts/reconcile", () => {
    it("rejects a request without the cron secret", async () => {
        const { POST } = await import("@/app/api/alerts/reconcile/route");
        const response = await POST(request(null) as never);
        expect(response.status).toBe(401);
        expect(rpc).not.toHaveBeenCalled();
    });

    it("503s when no source could be read, rather than resolving everything", async () => {
        const response = await callRoute();
        expect(response.status).toBe(503);
        expect(rpc).not.toHaveBeenCalled();
    });

    it("grants resolution to a module whose evidence is complete", async () => {
        getAmcRegister.mockResolvedValue([amcRow({})]);
        const response = await callRoute();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.evaluatedModules).toEqual(["contractors"]);
        expect(body.resolvableModules).toEqual(["contractors"]);

        const [, args] = rpc.mock.calls[0];
        expect(args.p_evaluated_modules).toEqual(["contractors"]);
        expect(args.p_resolvable_modules).toEqual(["contractors"]);
    });

    // The defect: any non-empty fetch counted as a full evaluation, so a log
    // missing half its readings produced fewer alerts and closed the rest.
    it("reads a sparse STP log but denies it the authority to close incidents", async () => {
        from.mockReturnValue(stpRows([
            { id: 1, date: "2026-07-11", inlet_sewage: 500, tse_for_irrigation: 450, tanker_trips: 2 },
            { id: 2, date: "2026-07-12", inlet_sewage: 500, tse_for_irrigation: null, tanker_trips: null },
        ]));

        const response = await callRoute();
        const body = await response.json();

        expect(body.evaluatedModules).toContain("stp");
        expect(body.resolvableModules).not.toContain("stp");
        expect(body.withheldResolution.stp).toBeTruthy();

        // …and the alert it DID detect is still persisted. Withholding
        // resolution must never suppress detection.
        const [, args] = rpc.mock.calls[0];
        expect(args.p_alerts.some((alert: { id: string }) => alert.id === "stp-missing-readings")).toBe(true);
    });

    it("never claims resolution authority it did not evaluate", async () => {
        getAmcRegister.mockResolvedValue([amcRow({})]);
        from.mockReturnValue(stpRows([
            { id: 1, date: "2026-07-12", inlet_sewage: 500, tse_for_irrigation: null, tanker_trips: null },
        ]));

        await callRoute();
        const [, args] = rpc.mock.calls[0];
        for (const resolvable of args.p_resolvable_modules) {
            expect(args.p_evaluated_modules).toContain(resolvable);
        }
    });

    it("reports 500 without swallowing a failed reconciliation", async () => {
        getAmcRegister.mockResolvedValue([amcRow({})]);
        rpc.mockResolvedValue({ error: { message: "permission denied" } });
        const response = await callRoute();
        expect(response.status).toBe(500);
    });
});
