export interface Customer {
  id: number;

  customer_number: string | null;
  salutation: 'Herr' | 'Frau' | null;

  first_name: string;
  last_name: string;

  date_of_birth: string | null;
  email: string | null;
  phone: string | null;

  street: string | null;
  zip_code: string | null;
  city: string | null;
  country: string;
  created_at: string;
  updated_at: string;
  active_status: string;
}
