import { CommonModule } from "@angular/common";
import { Component, DestroyRef, effect, inject, input, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { CustomerService } from "../../services/customer.service";
import { Customer } from "../../models/customer.model";
import { CustomerSearchMode } from "../../models/customer-search-mode.model";


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

  searchTerm = input<string>(""); // <-- input signal
  searchOption = input<CustomerSearchMode>("name");

  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(1);
  count = signal(0);
  next = signal<string | null>(null);
  previous = signal<string | null>(null);

  constructor() {
    effect(() => {
      const term = (this.searchTerm() || "").trim(); // <-- read signal
      const mode = this.searchOption();
      this.page.set(1);
      this.loadCustomers(term, mode, 1);
    });
  }

  /**
   * Reloads the customer page whenever search filters or pagination change.
   */
  loadCustomers(term = "", mode: CustomerSearchMode = "name", page = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.customerService.getCustomers(term, mode, page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  goNext(): void {
    if (!this.next()) return;
    const newPage = this.page() + 1;
    this.page.set(newPage);
    this.loadCustomers((this.searchTerm() || "").trim(), this.searchOption(), newPage);
  }

  goPrev(): void {
    if (!this.previous()) return;
    const newPage = Math.max(1, this.page() - 1);
    this.page.set(newPage);
    this.loadCustomers((this.searchTerm() || "").trim(), this.searchOption(), newPage);
  }

  goToCustomer(id: number): void {
    this.router.navigate(["/customer", id]);
  }
}
