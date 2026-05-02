import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Common shape returned by both /api/document-categories/ and /api/contract-types/.
 * Both are simple per-broker taxonomies with optional one-level parent/child nesting.
 */
export interface TaxonomyItem {
  id: number;
  slug: string;
  label: string;
  parent: number | null;
  created_at: string;
}

/**
 * Adapter the management modal uses to drive any TaxonomyItem-shaped taxonomy.
 *
 * Both `CategoryService` and `ContractTypeService` implement this implicitly
 * via duck typing — they expose `items` as a signal and the same CRUD methods.
 */
export interface TaxonomyAdapter {
  readonly items: Signal<TaxonomyItem[]>;
  load(): void;
  create(label: string, parent: number | null): Observable<TaxonomyItem>;
  update(id: number, patch: { label?: string; parent?: number | null }): Observable<TaxonomyItem>;
  delete(id: number): Observable<void>;
}
