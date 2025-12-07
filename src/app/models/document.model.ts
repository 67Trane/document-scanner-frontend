import { Customer } from './customer.model';

export interface CustomerDocument {
  id: number;
  file_path: string;
  file_url: string;
  raw_text: string;
  policy_number: string | null;
  license_plates: string[];
  customer: Customer;
  created_at: string; // ISO datetime
}
