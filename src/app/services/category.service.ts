import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AppConfig } from '../runtime-config';
import { DocumentCategoryItem } from '../models/document.model';

/**
 * Loads and caches the broker's document categories.
 *
 * Categories rarely change, so the service exposes a single `categories` signal
 * shared across components. Call `load()` to populate it; subsequent calls
 * are no-ops unless `refresh()` is used to force a reload after mutation.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly url = `${AppConfig.apiBaseUrl}/api/document-categories/`;

  private readonly _categories = signal<DocumentCategoryItem[]>([]);
  private readonly _loaded = signal(false);

  /** All categories the broker can see, in load order. */
  readonly categories = this._categories.asReadonly();

  /** Top-level categories only (no parent). */
  readonly topLevel = computed(() => this.categories().filter(c => c.parent === null));

  /** Returns the children of a given category id. */
  childrenOf(parentId: number): DocumentCategoryItem[] {
    return this.categories().filter(c => c.parent === parentId);
  }

  /**
   * Fetch categories once. Idempotent — calling repeatedly will not re-hit the API.
   * Use `refresh()` to force a reload.
   */
  load(): void {
    if (this._loaded()) return;
    this.fetch().subscribe();
  }

  refresh(): Observable<DocumentCategoryItem[]> {
    return this.fetch();
  }

  private fetch(): Observable<DocumentCategoryItem[]> {
    return this.http.get<DocumentCategoryItem[]>(this.url).pipe(
      tap(items => {
        this._categories.set(items);
        this._loaded.set(true);
      }),
    );
  }
}
