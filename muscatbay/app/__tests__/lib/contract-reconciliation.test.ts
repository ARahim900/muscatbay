import { describe, expect, it } from "vitest";
import { reconcileContractDates, type ContractDateEvidence } from "@/lib/contract-reconciliation";

function evidence(partial: Partial<ContractDateEvidence>): ContractDateEvidence {
    return {
        source: "amc_register", recordId: "AMC-1", contractor: "Gulf Expert",
        service: "HVAC", contractRef: "GE-2025-HVAC", startDate: "2025-07-01",
        endDate: "2028-06-30", evidenceAnchor: "Signed contract", ...partial,
    };
}

describe("contract date reconciliation", () => {
    it("surfaces conflicting dates by reference without choosing a winner", () => {
        const result = reconcileContractDates([
            evidence({}),
            evidence({ source: "gulf_expert_contracts", recordId: "7", endDate: "2027-06-30" }),
        ]);
        expect(result.contracts[0].contractRef).toBe("GE-2025-HVAC");
        expect(result.contracts[0].canonicalEndDate).toBeNull();
        expect(result.contracts[0].conflictFields).toEqual(["end_date"]);
        expect(result.contracts[0].evidence).toHaveLength(2);
    });

    it("keeps unreferenced records outside canonical reconciliation", () => {
        const result = reconcileContractDates([evidence({ contractRef: null })]);
        expect(result.contracts).toHaveLength(0);
        expect(result.unreferenced).toHaveLength(1);
    });
});
