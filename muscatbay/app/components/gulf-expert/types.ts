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

export interface GulfExpertData {
  findings: PpmFinding[];
  recurringIssues: RecurringIssue[];
}
