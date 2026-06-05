import { Injectable, signal } from '@angular/core';
import { Customer } from '../models/customer.model';

export interface RecentCustomer {
  id: number;
  firstName: string;
  lastName: string;
  customerNumber: string | null;
  openedAt: number;
}

const STORAGE_KEY = 'docuscan.recentCustomers';
const MAX_ENTRIES = 6;

@Injectable({ providedIn: 'root' })
export class RecentCustomersService {
  readonly recents = signal<RecentCustomer[]>(this.load());

  add(customer: Pick<Customer, 'id' | 'first_name' | 'last_name' | 'customer_number'>): void {
    const entry: RecentCustomer = {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      customerNumber: customer.customer_number,
      openedAt: Date.now(),
    };

    const next = [entry, ...this.recents().filter((r) => r.id !== entry.id)].slice(0, MAX_ENTRIES);
    this.recents.set(next);
    this.persist(next);
  }

  remove(id: number): void {
    const next = this.recents().filter((r) => r.id !== id);
    this.recents.set(next);
    this.persist(next);
  }

  clear(): void {
    this.recents.set([]);
    this.persist([]);
  }

  private load(): RecentCustomer[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RecentCustomer[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  }

  private persist(entries: RecentCustomer[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Quota exceeded or storage disabled — ignore.
    }
  }
}
