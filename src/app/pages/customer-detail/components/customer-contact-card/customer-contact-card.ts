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
  customer = input<Customer | null>(null);
  private customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private customerId: number = 0;

  constructor() {
    this.customerId = Number(this.route.snapshot.paramMap.get("id"));
  }

  // Values
  email = input<string | null>(null);
  phone = input<string | null>(null);
  addressLine1 = input<string>("");
  addressLine2 = input<string>("");

  // Arrays
  licensePlates = input<string[]>([]);
  policyNumbers = input<string[]>([]);

  // Flags
  hasLicensePlates = computed(() => this.licensePlates().length > 0);
  hasPolicyNumbers = computed(() => this.policyNumbers().length > 0);

  // Edit mode state
  isEditing = signal(false);

  // Editable values
  editEmail = signal<string>("");
  editPhone = signal<string>("");
  editAddressLine1 = signal<string>("");
  editAddressLine2 = signal<string>("");
  editLicensePlates = signal<string[]>([]);
  editPolicyNumbers = signal<string[]>([]);

  // Temporary input for adding new items
  newLicensePlate = signal<string>("");
  newPolicyNumber = signal<string>("");

  // Output events
  saveChanges = output<{
    email: string | null;
    phone: string | null;
    addressLine1: string;
    addressLine2: string;
  }>();

  toggleEdit() {
    if (!this.isEditing()) {
      // Enter edit mode
      this.editEmail.set(this.email() || "");
      this.editPhone.set(this.phone() || "");
      this.editAddressLine1.set(this.addressLine1());
      this.editAddressLine2.set(this.addressLine2());
      this.editLicensePlates.set([...this.licensePlates()]);
      this.editPolicyNumbers.set([...this.policyNumbers()]);
      this.newLicensePlate.set("");
      this.newPolicyNumber.set("");
      this.isEditing.set(true);
      return;
    }

    // Exit edit mode - send PATCH
    const payload: Partial<Customer> = {
      email: this.editEmail() || null,
      phone: this.editPhone(),
      street: this.editAddressLine1(),

      // license_plates: this.editLicensePlates(),
      // policy_numbers: this.editPolicyNumbers(),
    };

    this.customerService.patchCustomer(this.customerId, payload).subscribe({
      next: (updated) => {
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
      },
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.newLicensePlate.set("");
    this.newPolicyNumber.set("");
  }

  // License Plate Management
  addLicensePlate() {
    const plate = this.newLicensePlate().trim().toUpperCase();
    if (plate && !this.editLicensePlates().includes(plate)) {
      this.editLicensePlates.update(plates => [...plates, plate]);
      this.newLicensePlate.set("");
    }
  }

  removeLicensePlate(plate: string) {
    this.editLicensePlates.update(plates => plates.filter(p => p !== plate));
  }

  // Policy Number Management
  addPolicyNumber() {
    const number = this.newPolicyNumber().trim();
    if (number && !this.editPolicyNumbers().includes(number)) {
      this.editPolicyNumbers.update(numbers => [...numbers, number]);
      this.newPolicyNumber.set("");
    }
  }

  removePolicyNumber(number: string) {
    this.editPolicyNumbers.update(numbers => numbers.filter(n => n !== number));
  }

  // Handle Enter key for adding items
  onLicensePlateKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addLicensePlate();
    }
  }

  onPolicyNumberKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addPolicyNumber();
    }
  }
}