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

  private baseUrl = `${AppConfig.apiBaseUrl}api/documents/`;

  getDocuments(): Observable<CustomerDocument[]> {
    return this.http.get<CustomerDocument[]>(this.baseUrl);
  }

  getDocument(id: number): Observable<CustomerDocument> {
    return this.http.get<CustomerDocument>(`${this.baseUrl}${id}/`);
  }

  importFromPdf(pdfPath: string): Observable<any> {
    return this.http.post(`${AppConfig.apiBaseUrl}api/import-document-from-pdf/`, {
      pdf_path: pdfPath,
    });
  }
}
