import { Injectable, effect, inject, signal } from '@angular/core';
import { Customer } from '../models/customer.model';
import { AuthService } from './auth.service';

export interface RecentCustomer {
  id: number;
  firstName: string;
  lastName: string;
  customerNumber: string | null;
  openedAt: number;
}

const STORAGE_PREFIX = 'docuscan.recentCustomers';
const LEGACY_STORAGE_KEY = STORAGE_PREFIX; // pre-multi-user single global key
const MAX_ENTRIES = 6;

/**
 * Stores the broker's most recently opened customers.
 *
 * Each broker has their own slot in localStorage keyed by user id —
 * customers belonging to one broker are never visible to another after
 * an account switch on the same browser. The signal is seeded
 * synchronously at construction so any consumer reading it in its own
 * constructor sees the restored list (not an empty array). An effect
 * refreshes the list whenever the auth user changes.
 */
@Injectable({ providedIn: 'root' })
export class RecentCustomersService {
  private readonly auth = inject(AuthService);

  readonly recents = signal<RecentCustomer[]>(this.computeInitial());

  /** Skip the implicit first invocation of the auth-change effect. */
  private skipFirstAuthCheck = true;

  constructor() {
    this.removeLegacyKey();

    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      if (this.skipFirstAuthCheck) {
        this.skipFirstAuthCheck = false;
        return;
      }
      this.recents.set(userId === null ? [] : this.load(userId));
    });
  }

  add(customer: Pick<Customer, 'id' | 'first_name' | 'last_name' | 'customer_number'>): void {
    const userId = this.auth.user()?.id;
    if (userId === undefined) return;

    const entry: RecentCustomer = {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      customerNumber: customer.customer_number,
      openedAt: Date.now(),
    };

    const next = [entry, ...this.recents().filter((r) => r.id !== entry.id)].slice(0, MAX_ENTRIES);
    this.recents.set(next);
    this.persist(userId, next);
  }

  remove(id: number): void {
    const userId = this.auth.user()?.id;
    if (userId === undefined) return;

    const next = this.recents().filter((r) => r.id !== id);
    this.recents.set(next);
    this.persist(userId, next);
  }

  clear(): void {
    const userId = this.auth.user()?.id;
    this.recents.set([]);
    if (userId !== undefined) this.persist(userId, []);
  }

  private computeInitial(): RecentCustomer[] {
    const userId = this.auth.user()?.id ?? null;
    return userId === null ? [] : this.load(userId);
  }

  private keyFor(userId: number | string): string {
    return `${STORAGE_PREFIX}.${userId}`;
  }

  private load(userId: number | string): RecentCustomer[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.keyFor(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RecentCustomer[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  }

  private persist(userId: number | string, entries: RecentCustomer[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.keyFor(userId), JSON.stringify(entries));
    } catch {
      // Quota exceeded or storage disabled — ignore.
    }
  }

  private removeLegacyKey(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // Ignore — best-effort cleanup.
    }
  }
}
