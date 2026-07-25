export interface PpmFinding {
  id: number;
  finding_code: string;
  equipment_id: string;
  building: string;
  system_type: string;
  equipment_label: string;
  fiscal_year: string;
  ppm_visit: string;
  description: string;
  quantity: number;
  priority: string;
  status: string;
  quotation_ref: string | null;
  action_required: string;
  contractor_notes: string | null;
  is_recurring: boolean;
  first_identified_ppm: string | null;
}

export interface RecurringIssue {
  id: number;
  equipment_id: string;
  building: string;
  equipment_label: string;
  issue_type: string;
  first_ppm: string;
  last_ppm: string;
  occurrence_count: number;
  still_open: boolean;
  resolved_ppm: string | null;
  notes: string | null;
}

/** Maps to public.gulf_expert_contracts — the AMC agreements behind the HVAC/BMS cards. */
export interface GulfExpertContract {
  id: number;
  /** e.g. "HVAC_AMC" | "BMS_AMC" (free text in the database). */
  contract_type: string;
  contract_ref: string;
  start_date: string | null;
  end_date: string | null;
  value_omr_excl_vat: number | string | null;
  value_omr_incl_vat: number | string | null;
  /** e.g. "ACTIVE" | "EXPIRED" (free text in the database). */
  status: string;
  scope_summary: string | null;
  ppm_visits_per_year: number | null;
  emergency_visits_per_year: number | null;
  emergency_response_hours: number | null;
  notes: string | null;
}

/** Maps to public.gulf_expert_communications — the AMC correspondence log. */
export interface GulfExpertCommunication {
  id: number;
  communication_date: string | null;
  direction: string | null;
  subject: string;
  from_person: string | null;
  summary: string | null;
  action_required: string | null;
  /** e.g. "OPEN" | "CLOSED" (free text in the database). */
  action_status: string | null;
  related_contract: string | null;
}

export interface GulfExpertData {
  findings: PpmFinding[];
  recurringIssues: RecurringIssue[];
  contracts: GulfExpertContract[];
  communications: GulfExpertCommunication[];
}
