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

export interface EquipmentRegistry {
  id: number;
  building: string;
  system_type: string;
  equipment_label: string;
  chiller_number: number | null;
  equipment_type: string;
  brand: string | null;
  model: string | null;
  operational_status: string;
  has_sys1: boolean;
  has_sys2: boolean;
  notes: string | null;
}

export interface CompressorStatus {
  id: number;
  building: string;
  chiller_number: number;
  system_number: number;
  compressor_number: number;
  status: string;
  last_updated: string | null;
  notes: string | null;
}

export interface Quotation {
  id: number;
  quotation_ref: string;
  submission_date: string | null;
  submitted_by: string | null;
  scope_summary: string;
  buildings_covered: string;
  total_items_count: number;
  urgency: string;
  status: string;
  lpo_number: string | null;
  lpo_issued_date: string | null;
  notes: string | null;
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

export interface EquipmentSummary {
  id: number;
  equipment_id: string;
  building: string;
  system_type: string;
  equipment_label: string;
  ppm1_findings: number;
  ppm2_findings: number;
  ppm3_findings: number;
  ppm4_findings: number;
  common_issues: string;
  fixed_issues: string;
  analysis_notes: string;
}

export interface GulfExpertData {
  findings: PpmFinding[];
  equipment: EquipmentRegistry[];
  compressors: CompressorStatus[];
  quotations: Quotation[];
  recurringIssues: RecurringIssue[];
  equipmentSummary: EquipmentSummary[];
}
