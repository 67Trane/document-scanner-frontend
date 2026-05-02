import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AppConfig } from '../runtime-config';
import { TaxonomyItem } from '../models/taxonomy.model';

/**
 * Loads and caches the broker's contract types.
 *
 * Same shape as `CategoryService` — both implement the implicit
 * "TaxonomyService" interface used by TaxonomyManagementModal so the same
 * management UI can drive either taxonomy.
 */
@Injectable({ providedIn: 'root' })
export class ContractTypeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${AppConfig.apiBaseUrl}/api/contract-types/`;

  private readonly _items = signal<TaxonomyItem[]>([]);
  private readonly _loaded = signal(false);

  readonly items = this._items.asReadonly();
  readonly topLevel = computed(() => this.items().filter(c => c.parent === null));

  childrenOf(parentId: number): TaxonomyItem[] {
    return this.items().filter(c => c.parent === parentId);
  }

  load(): void {
    if (this._loaded()) return;
    this.fetch().subscribe();
  }

  refresh(): Observable<TaxonomyItem[]> {
    return this.fetch();
  }

  create(label: string, parent: number | null = null): Observable<TaxonomyItem> {
    return this.http.post<TaxonomyItem>(this.url, { label, parent }).pipe(
      tap(item => this._items.update(items => [...items, item])),
    );
  }

  update(id: number, patch: { label?: string; parent?: number | null }): Observable<TaxonomyItem> {
    return this.http.patch<TaxonomyItem>(`${this.url}${id}/`, patch).pipe(
      tap(updated => this._items.update(items =>
        items.map(c => (c.id === id ? updated : c)),
      )),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`).pipe(
      tap(() => this._items.update(items =>
        items.filter(c => c.id !== id && c.parent !== id),
      )),
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
