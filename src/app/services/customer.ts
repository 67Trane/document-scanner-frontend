import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config';

// Type passend zu deinem Django-Customer-Model
export interface Customer {
  id: number;

  salutation: "Herr" | "Frau" | null;

  first_name: string;
  last_name: string;

  date_of_birth: string | null; // ISO-Date (z. B. "1990-01-01")
  email: string | null;
  phone: string | null;

  street: string | null;
  zip_code: string | null;
  city: string | null;
  country: string; // default: "Germany"

  policy_number: string | null;

  license_plates: string[];

  created_at: string;  // ISO timestamp
  updated_at: string;  // ISO timestamp
}


@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private http = inject(HttpClient);

  // später kannst du das in eine Config auslagern
  private baseUrl = `${AppConfig.apiBaseUrl}api/customers/`;

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}${id}/`);
  }
}
