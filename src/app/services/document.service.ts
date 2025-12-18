import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config';
import { CustomerDocument } from '../models/document.model';
import { map } from "rxjs/operators";
import { PaginatedResponse } from '../models/paginated-response.model';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {

  private http = inject(HttpClient);

  private baseUrl = `${AppConfig.apiBaseUrl}`;

  getDocuments(): Observable<CustomerDocument[]> {
    return this.http.get<CustomerDocument[]>(`${this.baseUrl}api/documents/`);
  }

  getDocument(id: number): Observable<CustomerDocument> {
    const url = new URL(`/api/documents/${id}/`, this.baseUrl).toString();
    return this.http.get<CustomerDocument>(url);
  }

  importFromPdf(pdfPath: string): Observable<any> {
    return this.http.post(`${this.baseUrl}api/import-document-from-pdf/`, {
      pdf_path: pdfPath,
    });
  }

  getDocumentsByCustomer(customerId: number) {
    const url = new URL("/api/documents/", AppConfig.apiBaseUrl).toString();

    return this.http
      .get<PaginatedResponse<CustomerDocument>>(url, {
        params: { customer: String(customerId) },
      })
      .pipe(map(res => res.results));
  }
}
