import { Customer } from './customer.model';

export type DocumentStatus = 'aktiv' | 'ruhend';

export type ContractType =
  | 'Kfz-Versicherung'
  | 'haftpflicht'
  | 'hausrat'
  | 'rechtschutz'
  | 'wohngebaeude'
  | 'unfall'
  | 'berufsunfaehigkeit'
  | 'krankenversicherung';

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
  contract_typ_display: ContractType;

  extracted_data?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;

  created_at: string;
}
