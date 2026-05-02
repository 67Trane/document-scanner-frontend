import { Customer } from './customer.model';

export type DocumentStatus = 'aktiv' | 'ruhend';

// Contract type slugs are broker-defined and dynamic. Loosened to string —
// the live list comes from ContractTypeService (/api/contract-types/).
export type ContractType = string;

// Slugs are now broker-defined and dynamic. The narrow union type is gone —
// keep an alias so existing call sites don't break, but treat it as a string.
export type DocumentCategory = string;

export type ActivityLogAction = 'customer_created' | 'document_assigned' | 'document_unresolved';

export interface ActivityLog {
  id: number;
  action: ActivityLogAction;
  description: string;
  created_at: string;
}

export interface CustomerDocument {
  id: number;
  file_path: string;
  file_url: string;
  raw_text: string;
  policy_numbers: string[];
  license_plates: string[];
  customer: Customer | null;

  contract_status: DocumentStatus;
  contract_typ: ContractType;
  contract_typ_display: string;
  document_category: DocumentCategory | null;
  document_category_display: string | null;

  extracted_data?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;

  created_at: string;
}
