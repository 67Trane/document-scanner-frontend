import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal, inject, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Customer } from "../../../../models/customer.model";
import { CustomerService } from "../../../../services/customer.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-customer-contact-card",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./customer-contact-card.html",
  styleUrl: "./customer-contact-card.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerContactCard {
  // Used for skeleton/conditional rendering (keeps the original behavior)
  customer = input<Customer | null>(null);
  private customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private customerId: number = 0


  constructor() {
    this.customerId = Number(this.route.snapshot.paramMap.get("id"));
  }


  // Values (Parent liefert die fertigen Strings)
  email = input<string | null>(null);
  phone = input<string | null>(null);
  addressLine1 = input<string>("");
  addressLine2 = input<string>("");

  // Arrays
  licensePlates = input<string[]>([]);
  policyNumbers = input<string[]>([]);

  // Flags (computed)
  hasLicensePlates = computed(() => this.licensePlates().length > 0);
  hasPolicyNumbers = computed(() => this.policyNumbers().length > 0);

  // Edit mode state
  isEditing = signal(false);

  // Editable values
  editEmail = signal<string>("");
  editPhone = signal<string>("");
  editAddressLine1 = signal<string>("");
  editAddressLine2 = signal<string>("");

  // Output events for parent to handle saves
  saveChanges = output<{
    email: string | null;
    phone: string | null;
    addressLine1: string;
    addressLine2: string;
  }>();

  toggleEdit() {
    if (!this.isEditing()) {
      // Enter edit mode - copy current values into editable signals
      this.editEmail.set(this.email() || "");
      this.editPhone.set(this.phone() || "");
      this.editAddressLine1.set(this.addressLine1());
      this.editAddressLine2.set(this.addressLine2());
      this.isEditing.set(true);
      return;
    }

    // Exit edit mode - send PATCH (must subscribe!)
    const payload: Partial<Customer> = {
      email: this.editEmail() || null,
      phone: this.editPhone(),
      street: this.editAddressLine1(),
    };

    this.customerService.patchCustomer(this.customerId, payload).subscribe({
      next: (updated) => {
        // Emit to parent if you still need it
        this.saveChanges.emit({
          email: updated.email ?? null,
          phone: updated.phone ?? null,
          addressLine1: updated.street ?? '',
          addressLine2: updated.zip_code ?? '',
        });

        this.isEditing.set(false);
      },
      error: (err) => {
        console.error('PATCH failed', err);
        // Keep editing open so user does not lose changes
        // Optionally show a toast
      },
    });
  }


  cancelEdit() {
    this.isEditing.set(false);
  }
}