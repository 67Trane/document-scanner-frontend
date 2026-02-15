import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal, inject, ChangeDetectionStrategy } from "@angular/core";
import { forkJoin } from "rxjs";
import { Customer } from "../../../../models/customer.model";
import { CustomerService } from "../../../../services/customer.service";
import { DocumentService } from "../../../../services/document.service";
import { CustomerDocument } from "../../../../models/document.model";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-customer-contact-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-contact-card.html",
  styleUrl: "./customer-contact-card.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerContactCard {
  /**
   * Encapsulates editable customer contact and policy metadata for the detail page sidebar.
   */
  customer = input<Customer | null>(null);
  
  private readonly customerService = inject(CustomerService);
  private readonly documentService = inject(DocumentService);
  private readonly route = inject(ActivatedRoute);
  private readonly customerId = Number(this.route.snapshot.paramMap.get("id"));

  // Values
  email = input<string | null>(null);
  phone = input<string | null>(null);
  addressLine1 = input<string>("");
  addressLine2 = input<string>("");
  birthday = input<string | null>(null);

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
  editBirthday = signal<string>("");
  editAddressLine1 = signal<string>("");
  editAddressLine2 = signal<string>("");
  editLicensePlates = signal<string[]>([]);
  editPolicyNumbers = signal<string[]>([]);
  saveError = signal<string | null>(null);

  // Temporary input for adding new items
  newLicensePlate = signal<string>("");
  newPolicyNumber = signal<string>("");

  // Output event to notify parent of changes
  contactUpdated = output<void>();

  /**
   * A single toggle entry point keeps edit-mode transitions predictable for the parent page.
   */
  toggleEdit(): void {
    if (!this.isEditing()) {
      // Clone current values so cancel can fully restore the pre-edit state.
      this.editEmail.set(this.email() || "");
      this.editPhone.set(this.phone() || "");
      this.editBirthday.set(this.birthday() || "");
      this.editAddressLine1.set(this.addressLine1());
      this.editAddressLine2.set(this.addressLine2());
      this.editLicensePlates.set([...this.licensePlates()]);
      this.editPolicyNumbers.set([...this.policyNumbers()]);
      this.newLicensePlate.set("");
      this.newPolicyNumber.set("");
      this.saveError.set(null);
      this.isEditing.set(true);
      return;
    }

    this.saveCustomerAndDocument();
  }

  private saveCustomerAndDocument(): void {
    const customerPayload: Partial<Customer> = {
      email: this.editEmail() || null,
      phone: this.editPhone(),
      street: this.editAddressLine1(),
      date_of_birth: this.editBirthday() || null,
    };

    const documentPayload: Partial<CustomerDocument> = {
      license_plates: this.editLicensePlates(),
      policy_numbers: this.editPolicyNumbers(),
    };

    this.saveError.set(null);

    forkJoin({
      customer: this.customerService.patchCustomer(this.customerId, customerPayload),
      document: this.documentService.patchDocument(this.customerId, documentPayload),
    }).subscribe({
      next: () => {
        this.isEditing.set(false);
        this.contactUpdated.emit();
      },
      error: () => {
        this.saveError.set("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      },
    });
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.newLicensePlate.set("");
    this.newPolicyNumber.set("");
    this.saveError.set(null);
  }

  addLicensePlate(): void {
    const plate = this.newLicensePlate().trim().toUpperCase();
    if (plate && !this.editLicensePlates().includes(plate)) {
      this.editLicensePlates.update(plates => [...plates, plate]);
      this.newLicensePlate.set("");
    }
  }

  removeLicensePlate(plate: string): void {
    this.editLicensePlates.update(plates => plates.filter(p => p !== plate));
  }

  addPolicyNumber(): void {
    const number = this.newPolicyNumber().trim();
    if (number && !this.editPolicyNumbers().includes(number)) {
      this.editPolicyNumbers.update(numbers => [...numbers, number]);
      this.newPolicyNumber.set("");
    }
  }

  removePolicyNumber(number: string): void {
    this.editPolicyNumbers.update(numbers => numbers.filter(n => n !== number));
  }

  onLicensePlateKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addLicensePlate();
    }
  }

  onPolicyNumberKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addPolicyNumber();
    }
  }

  onEditEmailInput(event: Event): void {
    this.editEmail.set((event.target as HTMLInputElement).value);
  }

  onEditPhoneInput(event: Event): void {
    this.editPhone.set((event.target as HTMLInputElement).value);
  }

  onEditBirthdayInput(event: Event): void {
    this.editBirthday.set((event.target as HTMLInputElement).value);
  }

  onEditAddressLine1Input(event: Event): void {
    this.editAddressLine1.set((event.target as HTMLInputElement).value);
  }

  onEditAddressLine2Input(event: Event): void {
    this.editAddressLine2.set((event.target as HTMLInputElement).value);
  }

  onNewLicensePlateInput(event: Event): void {
    this.newLicensePlate.set((event.target as HTMLInputElement).value);
  }

  onNewPolicyNumberInput(event: Event): void {
    this.newPolicyNumber.set((event.target as HTMLInputElement).value);
  }
}
