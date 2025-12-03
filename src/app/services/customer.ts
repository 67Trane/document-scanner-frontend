import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config';

// Type passend zu deinem Django-Customer-Model
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip_code: string | null;
  city: string | null;
  country: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private http = inject(HttpClient);

  // später kannst du das in eine Config auslagern
  private baseUrl = `${AppConfig.apiBaseUrl}/customers/`;

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}${id}/`);
  }
}
