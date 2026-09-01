export interface ContractDateEvidence {
    source: "amc_register" | "gulf_expert_contracts";
    recordId: string;
    contractor: string;
    service: string | null;
    contractRef: string | null;
    startDate: string | null;
    endDate: string | null;
    evidenceAnchor: string | null;
}

export interface ReconciledContractDates {
    contractRef: string;
    canonicalStartDate: string | null;
    canonicalEndDate: string | null;
    conflictFields: Array<"start_date" | "end_date">;
    evidence: ContractDateEvidence[];
}

export interface ContractDateReconciliation {
    contracts: ReconciledContractDates[];
    unreferenced: ContractDateEvidence[];
}

function normalizedReference(reference: string | null): string | null {
    const value = reference?.trim().toUpperCase().replace(/\s+/g, " ") ?? "";
    return value.length > 0 ? value : null;
}

function reconcileField(values: Array<string | null>): { canonical: string | null; conflict: boolean } {
    const evidenced = [...new Set(values.filter((value): value is string => value !== null && value.trim() !== ""))];
    return {
        canonical: evidenced.length === 1 ? evidenced[0] : null,
        conflict: evidenced.length > 1,
    };
}

/**
 * Reconcile only records carrying the same contract reference. Conflicting
 * dates are surfaced with a null canonical value; no source is overwritten or
 * silently preferred.
 */
export function reconcileContractDates(evidence: ContractDateEvidence[]): ContractDateReconciliation {
    const byReference = new Map<string, ContractDateEvidence[]>();
    const unreferenced: ContractDateEvidence[] = [];

    for (const item of evidence) {
        const reference = normalizedReference(item.contractRef);
        if (!reference) {
            unreferenced.push(item);
            continue;
        }
        const existing = byReference.get(reference) ?? [];
        existing.push(item);
        byReference.set(reference, existing);
    }

    const contracts = [...byReference.entries()].map(([contractRef, items]) => {
        const start = reconcileField(items.map((item) => item.startDate));
        const end = reconcileField(items.map((item) => item.endDate));
        const conflictFields: Array<"start_date" | "end_date"> = [];
        if (start.conflict) conflictFields.push("start_date");
        if (end.conflict) conflictFields.push("end_date");
        return {
            contractRef,
            canonicalStartDate: start.canonical,
            canonicalEndDate: end.canonical,
            conflictFields,
            evidence: items,
        };
    });

    return { contracts, unreferenced };
}
