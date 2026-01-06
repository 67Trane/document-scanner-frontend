import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../runtime-config.dev';
import { Customer } from '../models/customer.model';
import { PaginatedResponse } from '../models/paginated-response.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private http = inject(HttpClient);

  // Base API endpoint for customers
  private baseUrl = `${AppConfig.apiBaseUrl}/api/customers/`;

  // =========================
  // READ
  // =========================

  /**
   * Get paginated list of customers.
   * Optional search query and page number.
   */
  getCustomers(q = '', page = 1): Observable<PaginatedResponse<Customer>> {
    const params: any = { page };
    if (q) params.q = q;

    return this.http.get<PaginatedResponse<Customer>>(this.baseUrl, { params });
  }

  /**
   * Get a single customer by ID.
   */
  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}${id}/`);
  }

  /**
   * Lightweight search without pagination.
   * Intended for autocomplete / quick search.
   */
  searchCustomers(term: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl, {
      params: { q: term },
    });
  }

  // =========================
  // WRITE
  // =========================

  /**
   * Create a new customer.
   * Only required fields need to be provided.
   */
  createCustomer(data: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, data);
  }

  /**
   * PARTIAL UPDATE (PATCH)
   * ----------------------
   * Updates only the provided fields.
   * Ideal for edit dialogs (e.g. phone number, email).
   *
   * Example:
   * patchCustomer(1, { phone: '+49 123 456' })
   */
  patchCustomer(id: number, data: Partial<Customer>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}${id}/`, data);
  }

  /**
   * FULL UPDATE (PUT)
   * -----------------
   * Replaces the entire customer resource.
   * Should ideally receive a complete Customer object.
   *
   * Note:
   * If your backend accepts partial data here,
   * this still works, but PATCH is the better choice
   * for partial edits.
   */
  updateCustomer(id: number, data: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}${id}/`, data);
  }

  /**
   * Delete a customer by ID.
   */
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
