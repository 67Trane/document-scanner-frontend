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
 * never leak into another account viewed in the same browser.
 *
 * The signals are initialised **synchronously** from localStorage so that
 * a consumer reading them in its own constructor (e.g. `CustomerList`'s
 * initial fetch) sees the restored values — not the defaults. An effect
 * still listens for later auth-user changes (logout/login) and refreshes
 * the values from the new user's slot.
 *
 * Search-mode changes (`searchTerm` or `searchOption`) should reset
 * `page` back to 1 — handled by the consumer (`CustomerList`), not
 * here, so this service stays a thin state container.
 */
@Injectable({ providedIn: 'root' })
export class CustomerListStateService {
  private readonly auth = inject(AuthService);

  /** Snapshot computed synchronously at construction — used to seed the signals. */
  private readonly initial: PersistedState = this.computeInitial();

  readonly page = signal<number>(this.initial.page);
  readonly searchTerm = signal<string>(this.initial.searchTerm);
  readonly searchOption = signal<CustomerSearchMode>(this.initial.searchOption);

  /** Skip persisting while we restore — we only want user-driven changes saved. */
  private suppressPersist = false;

  /** Skip the implicit first invocation of the auth-change effect — that's the initial mount. */
  private skipFirstAuthCheck = true;

  constructor() {
    this.removeLegacyKey();

    // Reload from the per-user slot when the auth user changes (logout / login).
    // The initial mount is already handled synchronously via `initial` above.
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      if (this.skipFirstAuthCheck) {
        this.skipFirstAuthCheck = false;
        return;
      }
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

  private computeInitial(): PersistedState {
    const userId = this.auth.user()?.id ?? null;
    return userId === null ? { ...DEFAULTS } : this.load(userId);
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
