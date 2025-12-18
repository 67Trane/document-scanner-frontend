import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config';
import { CustomerDocument } from '../models/document.model';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private http = inject(HttpClient);

  private baseUrl = `${AppConfig.apiBaseUrl}`;

  getDocuments(): Observable<CustomerDocument[]> {
    return this.http.get<CustomerDocument[]>(`${this.baseUrl}/api/documents/`);
  }

  getDocument(id: number): Observable<CustomerDocument> {
    return this.http.get<CustomerDocument>(`${this.baseUrl}/api/documents/${id}`);
  }

  importFromPdf(pdfPath: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/import-document-from-pdf/`, {
      pdf_path: pdfPath,
    });
  }

  getDocumentsByCustomer(customerId: number): Observable<CustomerDocument[]> {
    return this.http.get<CustomerDocument[]>(`${this.baseUrl}/api/documents/`, {
      params: { customer: customerId.toString() },
    });
  }
}
