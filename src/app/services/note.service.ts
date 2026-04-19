import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../runtime-config';
import { CustomerNote, NoteCategory } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private http = inject(HttpClient);
  private base = `${AppConfig.apiBaseUrl}/api/notes/`;

  getNotes(customerId: number): Observable<{ results: CustomerNote[] }> {
    return this.http.get<{ results: CustomerNote[] }>(this.base, {
      params: { customer: String(customerId) },
    });
  }

  createNote(customerId: number, data: { title: string; text: string; category: NoteCategory }): Observable<CustomerNote> {
    return this.http.post<CustomerNote>(this.base, { ...data, customer_id: customerId });
  }

  patchNote(id: number, data: Partial<Pick<CustomerNote, 'title' | 'text' | 'category' | 'is_done'>>): Observable<CustomerNote> {
    return this.http.patch<CustomerNote>(`${this.base}${id}/`, data);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${id}/`);
  }
}
