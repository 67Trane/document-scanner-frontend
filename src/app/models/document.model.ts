import { Customer } from './customer.model';

export type DocumentStatus = 'aktiv' | 'ruhend';

export type ContractType =
  | 'kfz'
  | 'haftpflicht'
  | 'hausrat'
  | 'rechtschutz'
  | 'wohngebaeude'
  | 'unfall'
  | 'lebensversicherung'
  | 'rentenversicherung'
  | 'berufsunfaehigkeit'
  | 'krankenversicherung'
  | 'tierversicherung'
  | 'reise'
  | 'gruene_karte';

export const CONTRACT_TYPE_OPTIONS: { value: ContractType | ''; label: string }[] = [
  { value: '',              label: 'Sonstige' },
  { value: 'kfz',               label: 'Kfz-Versicherung' },
  { value: 'haftpflicht',       label: 'Privat-Haftpflicht' },
  { value: 'hausrat',           label: 'Hausrat' },
  { value: 'rechtschutz',       label: 'Rechtsschutz' },
  { value: 'wohngebaeude',      label: 'Wohngebäudeversicherung' },
  { value: 'unfall',            label: 'Unfallversicherung' },
  { value: 'lebensversicherung', label: 'Lebensversicherung' },
  { value: 'rentenversicherung', label: 'Rentenversicherung' },
  { value: 'berufsunfaehigkeit', label: 'Berufsunfähigkeitsversicherung' },
  { value: 'krankenversicherung', label: 'Private Krankenversicherung' },
  { value: 'tierversicherung',  label: 'Tierhalterhaftpflicht / Tierkranken' },
  { value: 'reise',             label: 'Reiseversicherung' },
  { value: 'gruene_karte',      label: 'Grüne Karte' },
];

// Slugs are now broker-defined and dynamic. The narrow union type is gone —
// keep an alias so existing call sites don't break, but treat it as a string.
export type DocumentCategory = string;

/** Shape returned by GET /api/document-categories/ */
export interface DocumentCategoryItem {
  id: number;
  slug: string;
  label: string;
  parent: number | null;
  created_at: string;
}

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
