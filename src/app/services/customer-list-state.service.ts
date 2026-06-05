import { Injectable, effect, signal } from '@angular/core';

import { CustomerSearchMode } from '../models/customer-search-mode.model';

const STORAGE_KEY = 'customer-list:state';

interface PersistedState {
  page: number;
  searchTerm: string;
  searchOption: CustomerSearchMode;
}

const DEFAULTS: PersistedState = {
  page: 1,
  searchTerm: '',
  searchOption: 'name',
};

/**
 * Holds the customer list's pagination + search state across navigation.
 *
 * Survives in three ways:
 *   1. Service is a singleton (`providedIn: 'root'`) — state lives as long
 *      as the Angular application, so opening a customer detail page and
 *      coming back keeps the list exactly where it was.
 *   2. An effect mirrors every change to localStorage — a browser refresh
 *      or new tab also restores the last viewed page and filter.
 *   3. The service is initialised from localStorage at construction so the
 *      first read after page load already has the persisted values.
 *
 * Search-mode changes (`searchTerm` or `searchOption`) should reset `page`
 * back to 1 — done by the consumer (`CustomerList`), not here, so this
 * service stays a thin state container.
 */
@Injectable({ providedIn: 'root' })
export class CustomerListStateService {
  private readonly initial = this.readFromStorage();

  readonly page = signal<number>(this.initial.page);
  readonly searchTerm = signal<string>(this.initial.searchTerm);
  readonly searchOption = signal<CustomerSearchMode>(this.initial.searchOption);

  constructor() {
    effect(() => {
      const snapshot: PersistedState = {
        page: this.page(),
        searchTerm: this.searchTerm(),
        searchOption: this.searchOption(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // localStorage may be unavailable (private mode, quota).
        // Falling back to in-memory-only state is fine.
      }
    });
  }

  private readFromStorage(): PersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        page: typeof parsed.page === 'number' && parsed.page >= 1 ? parsed.page : DEFAULTS.page,
        searchTerm: typeof parsed.searchTerm === 'string' ? parsed.searchTerm : DEFAULTS.searchTerm,
        searchOption: this.isValidSearchOption(parsed.searchOption)
          ? parsed.searchOption
          : DEFAULTS.searchOption,
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private isValidSearchOption(value: unknown): value is CustomerSearchMode {
    return value === 'name' || value === 'license' || value === 'birthdate';
  }
}
