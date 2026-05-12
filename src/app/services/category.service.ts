import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AppConfig } from '../runtime-config';
import { TaxonomyItem } from '../models/taxonomy.model';

/**
 * Loads and caches the broker's document categories.
 *
 * Same shape as `ContractTypeService` — both implement the implicit
 * `TaxonomyAdapter` interface so the same management UI can drive either.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly url = `${AppConfig.apiBaseUrl}/api/document-categories/`;

  private readonly _items = signal<TaxonomyItem[]>([]);
  private readonly _loaded = signal(false);

  readonly items = this._items.asReadonly();

  load(): void {
    if (this._loaded()) return;
    this.fetch().subscribe();
  }

  refresh(): Observable<TaxonomyItem[]> {
    return this.fetch();
  }

  create(label: string): Observable<TaxonomyItem> {
    return this.http.post<TaxonomyItem>(this.url, { label }).pipe(
      tap(item => this._items.update(items => [...items, item])),
    );
  }

  update(id: number, patch: { label?: string }): Observable<TaxonomyItem> {
    return this.http.patch<TaxonomyItem>(`${this.url}${id}/`, patch).pipe(
      tap(updated => this._items.update(items =>
        items.map(c => (c.id === id ? updated : c)),
      )),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`).pipe(
      tap(() => this._items.update(items => items.filter(c => c.id !== id))),
    );
  }

  private fetch(): Observable<TaxonomyItem[]> {
    return this.http.get<TaxonomyItem[]>(this.url).pipe(
      tap(items => {
        this._items.set(items);
        this._loaded.set(true);
      }),
    );
  }
}
