import { Injectable, effect, inject, signal } from '@angular/core';

import { CustomerSearchMode } from '../models/customer-search-mode.model';
import { AuthService } from './auth.service';

const STORAGE_PREFIX = 'customer-list:state';

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
 * Per-broker scoped: the persisted slot in localStorage is keyed by the
 * current user id, so search terms and page numbers from one account
 * never leak into another account viewed in the same browser. The
 * in-memory signals are reloaded automatically when the auth user
 * changes.
 *
 * Search-mode changes (`searchTerm` or `searchOption`) should reset
 * `page` back to 1 — handled by the consumer (`CustomerList`), not
 * here, so this service stays a thin state container.
 */
@Injectable({ providedIn: 'root' })
export class CustomerListStateService {
  private readonly auth = inject(AuthService);

  readonly page = signal<number>(DEFAULTS.page);
  readonly searchTerm = signal<string>(DEFAULTS.searchTerm);
  readonly searchOption = signal<CustomerSearchMode>(DEFAULTS.searchOption);

  /** Skip persisting on the immediate reload after switching users. */
  private suppressPersist = false;

  constructor() {
    this.removeLegacyKey();

    // Reload the signals from the correct per-user slot whenever the user changes.
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      const restored = userId === null ? { ...DEFAULTS } : this.load(userId);
      this.suppressPersist = true;
      this.page.set(restored.page);
      this.searchTerm.set(restored.searchTerm);
      this.searchOption.set(restored.searchOption);
      this.suppressPersist = false;
    });

    // Persist on every change for the active user.
    effect(() => {
      const snapshot: PersistedState = {
        page: this.page(),
        searchTerm: this.searchTerm(),
        searchOption: this.searchOption(),
      };
      if (this.suppressPersist) return;
      const userId = this.auth.user()?.id;
      if (userId === undefined) return;
      try {
        localStorage.setItem(this.keyFor(userId), JSON.stringify(snapshot));
      } catch {
        // localStorage may be unavailable — in-memory state still works.
      }
    });
  }

  private keyFor(userId: number | string): string {
    return `${STORAGE_PREFIX}.${userId}`;
  }

  private load(userId: number | string): PersistedState {
    try {
      const raw = localStorage.getItem(this.keyFor(userId));
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

  private removeLegacyKey(): void {
    try {
      if (localStorage.getItem(STORAGE_PREFIX) !== null) {
        localStorage.removeItem(STORAGE_PREFIX);
      }
    } catch {
      // Best-effort cleanup of pre-multi-user-scope data.
    }
  }
}
