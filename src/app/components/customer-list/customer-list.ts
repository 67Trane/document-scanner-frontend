import { CommonModule } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { Router } from "@angular/router";
import { CustomerService } from "../../services/customer.service";
import { Customer } from "../../models/customer.model";

@Component({
  selector: "app-customer-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-list.html",
})
export class CustomerList {
  searchTerm = input<string>(""); // <-- input signal

  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(1);
  count = signal(0);
  next = signal<string | null>(null);
  previous = signal<string | null>(null);

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {
    effect(() => {
      const term = (this.searchTerm() || "").trim(); // <-- read signal
      this.page.set(1);
      this.loadCustomers(term, 1);
    });
  }

  loadCustomers(term = "", page = 1) {
    this.loading.set(true);
    this.error.set(null);

    this.customerService.getCustomers(term, page).subscribe({
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

  goNext() {
    if (!this.next()) return;
    const newPage = this.page() + 1;
    this.page.set(newPage);
    this.loadCustomers((this.searchTerm() || "").trim(), newPage);
  }

  goPrev() {
    if (!this.previous()) return;
    const newPage = Math.max(1, this.page() - 1);
    this.page.set(newPage);
    this.loadCustomers((this.searchTerm() || "").trim(), newPage);
  }

  goToCustomer(id: number) {
    this.router.navigate(["/customer", id]);
  }
}
