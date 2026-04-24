import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal, inject, ChangeDetectionStrategy } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { Customer } from "../../../../models/customer.model";
import { CustomerService } from "../../../../services/customer.service";
import { DocumentService } from "../../../../services/document.service";
import { CustomerDocument } from "../../../../models/document.model";
import { ActivatedRoute } from "@angular/router";

const FIELD_LABELS: Record<string, string> = {
  email:          "E-Mail",
  phone:          "Telefon",
  date_of_birth:  "Geburtsdatum",
  street:         "Straße",
  zip_code:       "PLZ",
  city:           "Ort",
  license_plates: "Kennzeichen",
  policy_numbers: "Versicherungsschein-Nummern",
};

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Enter a valid email address.":    "Ungültige E-Mail-Adresse.",
  "This field may not be blank.":    "Dieses Feld darf nicht leer sein.",
  "This field is required.":         "Dieses Feld ist erforderlich.",
  "Date has wrong format.":          "Ungültiges Datumsformat. Bitte TT.MM.JJJJ verwenden.",
  "Ensure this field has no more than": "Der eingegebene Wert ist zu lang.",
  "This field may not be null.":     "Dieses Feld darf nicht leer sein.",
  "A valid integer is required.":    "Bitte eine gültige Zahl eingeben.",
};

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
  documents = input<CustomerDocument[]>([]);

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
  editFullName = signal<string>("");
  editEmail = signal<string>("");
  editPhone = signal<string>("");
  editBirthday = signal<string>("");
  editAddressLine1 = signal<string>("");
  editZipCode = signal<string>("");
  editCity = signal<string>("");
  editLicensePlates = signal<string[]>([]);
  editPolicyNumbers = signal<string[]>([]);
  saveError = signal<string | null>(null);

  // Temporary input for adding new items
  newLicensePlate = signal<string>("");
  newPolicyNumber = signal<string>("");

  // Output event to notify parent of changes
  contactUpdated = output<void>();
  openSourceDocument = output<string>();

  /**
   * A single toggle entry point keeps edit-mode transitions predictable for the parent page.
   */
  toggleEdit(): void {
    if (!this.isEditing()) {
      // Clone current values so cancel can fully restore the pre-edit state.
      const c = this.customer();
      this.editFullName.set(`${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim());
      this.editEmail.set(this.email() || "");
      this.editPhone.set(this.phone() || "");
      this.editBirthday.set(this.birthday() || "");
      this.editAddressLine1.set(this.addressLine1());
      this.editZipCode.set(this.customer()?.zip_code ?? "");
      this.editCity.set(this.customer()?.city ?? "");
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
    const parts = this.editFullName().trim().split(/\s+/);
    const customerPayload: Partial<Customer> = {
      first_name: parts[0] ?? "",
      last_name: parts.slice(1).join(" "),
      email: this.editEmail() || null,
      phone: this.editPhone(),
      street: this.editAddressLine1(),
      zip_code: this.editZipCode() || "",
      city: this.editCity() || null,
      date_of_birth: this.editBirthday() || null,
    };

    this.saveError.set(null);

    const keepPlates = new Set(this.editLicensePlates());
    const keepPolicies = new Set(this.editPolicyNumbers());
    const docs = this.documents();

    // Plates/policies added by the user that don't exist in any document yet
    const allOriginalPlates = new Set(docs.flatMap(d => d.license_plates ?? []));
    const allOriginalPolicies = new Set(docs.flatMap(d => d.policy_numbers ?? []));
    const newPlates = this.editLicensePlates().filter(p => !allOriginalPlates.has(p));
    const newPolicies = this.editPolicyNumbers().filter(p => !allOriginalPolicies.has(p));

    const customerPatch$ = this.customerService.patchCustomer(this.customerId, customerPayload);

    // Patch every document: keep only values still in the edit list, add new ones to first doc
    const docPatches$ = docs.map((doc, i) => {
      const plates = (doc.license_plates ?? []).filter(p => keepPlates.has(p));
      const policies = (doc.policy_numbers ?? []).filter(p => keepPolicies.has(p));
      return this.documentService.patchDocument(doc.id, {
        license_plates: i === 0 ? [...plates, ...newPlates] : plates,
        policy_numbers: i === 0 ? [...policies, ...newPolicies] : policies,
      });
    });

    const save$: Observable<unknown[]> = forkJoin([customerPatch$, ...docPatches$]);

    save$.subscribe({
      next: () => {
        this.isEditing.set(false);
        this.contactUpdated.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saveError.set(this.parseError(err));
      },
    });
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 0) return "Keine Verbindung zum Server.";
    if (err.status === 403) return "Keine Berechtigung zum Speichern.";
    if (err.status >= 500) return "Serverfehler. Bitte erneut versuchen.";

    const body = err.error;
    if (body && typeof body === "object") {
      for (const field of Object.keys(body)) {
        const messages: string[] = Array.isArray(body[field]) ? body[field] : [body[field]];
        const label = FIELD_LABELS[field] ?? field;
        const raw = messages[0] ?? "";
        const translated = Object.keys(ERROR_TRANSLATIONS).find(k => raw.startsWith(k));
        const message = translated ? ERROR_TRANSLATIONS[translated] : raw;
        return `${label}: ${message}`;
      }
    }

    return "Speichern fehlgeschlagen. Bitte erneut versuchen.";
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

  onEditFullNameInput(event: Event): void {
    this.editFullName.set((event.target as HTMLInputElement).value);
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

  onEditZipCodeInput(event: Event): void {
    this.editZipCode.set((event.target as HTMLInputElement).value);
  }

  onEditCityInput(event: Event): void {
    this.editCity.set((event.target as HTMLInputElement).value);
  }

  onNewLicensePlateInput(event: Event): void {
    this.newLicensePlate.set((event.target as HTMLInputElement).value);
  }

  onNewPolicyNumberInput(event: Event): void {
    this.newPolicyNumber.set((event.target as HTMLInputElement).value);
  }
}
