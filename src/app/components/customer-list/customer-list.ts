import { CommonModule } from "@angular/common";
import { Component, DestroyRef, effect, inject, input, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { CustomerService } from "../../services/customer.service";
import { CustomerListStateService } from "../../services/customer-list-state.service";
import { Customer } from "../../models/customer.model";
import { CustomerSearchMode } from "../../models/customer-search-mode.model";

type SortField = "first_name" | "last_name";

const SORT_STORAGE_KEY = "customer-list:sort";

@Component({
  selector: "app-customer-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-list.html",
})
export class CustomerList {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly listState = inject(CustomerListStateService);

  searchTerm = input<string>("");
  searchOption = input<CustomerSearchMode>("name");

  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Sourced from the shared state service so the current page survives
  // navigating to a customer detail page and back.
  readonly page = this.listState.page;
  count = signal(0);
  next = signal<string | null>(null);
  previous = signal<string | null>(null);

  // Sort preference — persisted to localStorage so it survives reloads.
  // Defaults to "first_name" for new users.
  sortBy = signal<SortField>(this.readStoredSort());

  // Delete dialog state
  customerToDelete = signal<Customer | null>(null);
  deleteLoading = signal(false);
  deleteError = signal<string | null>(null);

  // First effect tick runs on mount with the restored search/sort values —
  // we want to honour the restored page in that case. Subsequent ticks
  // (the user actually changing search or sort) should always start at page 1.
  private isFirstEffectRun = true;

  constructor() {
    effect(() => {
      const term = (this.searchTerm() || "").trim();
      const mode = this.searchOption();
      const sort = this.sortBy();

      const page = this.isFirstEffectRun ? this.page() : 1;
      if (!this.isFirstEffectRun) {
        this.page.set(1);
      }
      this.isFirstEffectRun = false;

      this.loadCustomers(term, mode, page, sort);
    });
  }

  /**
   * Reloads the customer page whenever search filters, sort, or pagination change.
   */
  loadCustomers(
    term = "",
    mode: CustomerSearchMode = "name",
    page = 1,
    sort: SortField = this.sortBy(),
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.customerService.getCustomers(term, mode, page, sort).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.customers.set(res.results);
        this.count.set(res.count);
        this.next.set(res.next);
        this.previous.set(res.previous);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Fehler beim Laden der Kunden.");
        this.loading.set(false);
      },
    });
  }

  setSortBy(field: SortField): void {
    if (this.sortBy() === field) return;
    this.sortBy.set(field);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, field);
    } catch {
      // localStorage may be unavailable (private mode, quota): preference is
      // session-only in that case, no error to surface.
    }
  }

  private readStoredSort(): SortField {
    try {
      const stored = localStorage.getItem(SORT_STORAGE_KEY);
      return stored === "last_name" ? "last_name" : "first_name";
    } catch {
      return "first_name";
    }
  }

  goNext(): void {
    if (!this.next()) return;
    const newPage = this.page() + 1;
    this.page.set(newPage);
    this.loadCustomers((this.searchTerm() || "").trim(), this.searchOption(), newPage, this.sortBy());
  }

  goPrev(): void {
    if (!this.previous()) return;
    const newPage = Math.max(1, this.page() - 1);
    this.page.set(newPage);
    this.loadCustomers((this.searchTerm() || "").trim(), this.searchOption(), newPage, this.sortBy());
  }

  goToCustomer(id: number): void {
    this.router.navigate(["/customer", id]);
  }

  // ─── Delete ───────────────────────────────────────────────

  openDeleteDialog(customer: Customer): void {
    this.customerToDelete.set(customer);
    this.deleteError.set(null);
  }

  closeDeleteDialog(): void {
    if (this.deleteLoading()) return;
    this.customerToDelete.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const customer = this.customerToDelete();
    if (!customer) return;

    this.deleteLoading.set(true);
    this.deleteError.set(null);

    this.customerService.deleteCustomer(customer.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.customerToDelete.set(null);
        // Reload current page; if last item on page > 1, go back one page
        const currentPage = this.page();
        const isLastOnPage = this.customers().length === 1 && currentPage > 1;
        const newPage = isLastOnPage ? currentPage - 1 : currentPage;
        this.page.set(newPage);
        this.loadCustomers((this.searchTerm() || "").trim(), this.searchOption(), newPage, this.sortBy());
      },
      error: () => {
        this.deleteLoading.set(false);
        this.deleteError.set("Fehler beim Löschen des Kunden.");
      },
    });
  }
}