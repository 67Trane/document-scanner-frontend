import { CommonModule } from "@angular/common";
import { Component, inject, input, output, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Customer } from "../../../../models/customer.model";
import { CustomerService } from "../../../../services/customer.service";

@Component({
  selector: "app-customer-profile-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-profile-card.html",
  styleUrl: "./customer-profile-card.css",
})
export class CustomerProfileCard {
  customer = input<Customer | null>(null);

  // Stats (keine Logik hier drin – Parent liefert Zahlen)
  contractsCount = input<number>(0);
  vehiclesCount = input<number>(0);
  policiesCount = input<number>(0);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);
  private readonly customerId = Number(this.route.snapshot.paramMap.get("id"));

  customerUpdated = output<void>();

  showDeleteConfirm = signal(false);
  deleteError = signal<string | null>(null);
  isTogglingStatus = signal(false);

  toggleActiveStatus(): void {
    const current = this.customer()?.active_status;
    if (!current || this.isTogglingStatus()) return;
    const next = current === 'aktiv' ? 'ruhend' : 'aktiv';
    this.isTogglingStatus.set(true);
    this.customerService.patchCustomer(this.customerId, { active_status: next }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.customerUpdated.emit();
      },
      error: () => this.isTogglingStatus.set(false),
    });
  }

  confirmDelete(): void {
    this.deleteError.set(null);
    this.showDeleteConfirm.set(true);
  }

  deleteCustomer(): void {
    this.customerService.deleteCustomer(this.customerId).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.deleteError.set("Löschen fehlgeschlagen. Bitte erneut versuchen.");
      },
    });
  }
}