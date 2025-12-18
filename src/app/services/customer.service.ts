import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config';
import { Customer } from '../models/customer.model';
import { PaginatedResponse } from '../models/paginated-response.model';
@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private http = inject(HttpClient);

  private baseUrl = `${AppConfig.apiBaseUrl}/api/customers/`;



  getCustomers(q = "", page = 1) {
    const params: any = { page };
    if (q) params.q = q;

    return this.http
      .get<PaginatedResponse<Customer>>(this.baseUrl, { params });
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}${id}/`);
  }

  searchCustomers(term: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl, {
      params: { q: term },
    });
  }

  createCustomer(data: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, data);
  }

  updateCustomer(id: number, data: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}${id}/`, data);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
