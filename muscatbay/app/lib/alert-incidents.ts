import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperationalAlert } from "@/lib/operational-alerts";

export interface AlertIncident {
    id: string;
    fingerprint: string;
    module: OperationalAlert["module"];
    category: OperationalAlert["category"];
    level: OperationalAlert["level"];
    title: string;
    message: string;
    href: string;
    acknowledged_at: string | null;
    acknowledged_by: string | null;
    resolved_at: string | null;
}

export interface AlertIncidentReadResult {
    available: boolean;
    canAcknowledge: boolean;
    incidents: AlertIncident[];
}

export interface IncidentAwareAlert extends OperationalAlert {
    acknowledged: boolean;
    canAcknowledge: boolean;
}

/**
 * Durable open incidents remain visible even when their source is temporarily
 * unavailable. Fresh browser-evaluated conditions are appended read-only until
 * the trusted evaluator persists them.
 */
export function mergeOpenAlertIncidents(
    rawAlerts: OperationalAlert[],
    incidents: AlertIncident[],
    incidentStoreAvailable: boolean,
    canAcknowledgeIncidents: boolean,
): IncidentAwareAlert[] {
    const persistedIds = new Set(incidents.map((incident) => incident.fingerprint));
    const persisted = incidents.map((incident) => ({
        id: incident.fingerprint,
        level: incident.level,
        module: incident.module,
        category: incident.category,
        title: incident.title,
        message: incident.message,
        href: incident.href,
        acknowledged: incident.acknowledged_at != null,
        canAcknowledge: incidentStoreAvailable && canAcknowledgeIncidents,
    }));
    const pendingPersistence = rawAlerts
        .filter((alert) => !persistedIds.has(alert.id))
        .map((alert) => ({ ...alert, acknowledged: false, canAcknowledge: false }));

    return [...persisted, ...pendingPersistence];
}

/**
 * Read the server-owned incident lifecycle. A missing migration/policy is an
 * explicit read-only state, never permission to fall back to browser acks.
 */
export async function readOpenAlertIncidents(
    client: SupabaseClient,
): Promise<AlertIncidentReadResult> {
    const [incidentResult, roleResult] = await Promise.all([
        client
            .from("operational_alert_incidents")
            .select("id, fingerprint, module, category, level, title, message, href, acknowledged_at, acknowledged_by, resolved_at")
            .is("resolved_at", null)
            .order("detected_at", { ascending: false }),
        client.rpc("mb_current_user_role"),
    ]);
    const { data, error } = incidentResult;

    if (error) {
        console.warn("Durable alert incidents unavailable; alerts are read-only:", error.message);
        return { available: false, canAcknowledge: false, incidents: [] };
    }
    if (roleResult.error) {
        console.warn("Alert acknowledgement role check unavailable; alerts are read-only:", roleResult.error.message);
    }
    const role = roleResult.error ? null : roleResult.data;
    return {
        available: true,
        canAcknowledge: role === "admin" || role === "manager" || role === "operator",
        incidents: (data ?? []) as AlertIncident[],
    };
}

export async function acknowledgeAlertIncident(
    client: SupabaseClient,
    incidentId: string,
): Promise<boolean> {
    const { data, error } = await client.rpc("acknowledge_operational_alert_incident", {
        p_incident_id: incidentId,
    });
    if (error) {
        console.error("Unable to acknowledge alert incident:", error.message);
        return false;
    }
    return data === true;
}
