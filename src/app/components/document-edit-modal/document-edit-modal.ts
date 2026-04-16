import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { CustomerService } from '../../services/customer.service';
import { CustomerSearchMode } from '../../models/customer-search-mode.model';
import { Customer } from '../../models/customer.model';
import { CustomerDocument } from '../../models/document.model';

@Component({
  selector: 'app-document-edit-modal',
  standalone: true,
  imports: [],
  templateUrl: './document-edit-modal.html',
  styleUrl: './document-edit-modal.css',
})
export class DocumentEditModal {
  // Services
  private readonly documents = inject(DocumentService);
  private readonly customers = inject(CustomerService);

  // Inputs/Outputs
  doc = input<CustomerDocument | null>(null);
  close = output<void>();
  assigned = output<CustomerDocument>();

  // Form fields (OCR)
  firstName = signal('');
  lastName = signal('');

  // Search state
  searchTerm = signal('');
  searchMode = signal<CustomerSearchMode>('name');
  isSearching = signal(false);
  errorMsg = signal<string>('');

  // Results (paginated)
  results = signal<Customer[]>([]);
  page = signal(1);
  count = signal(0);
  hasNext = signal(false);

  // Selection
  selectedCustomer = signal<Customer | null>(null);

  // Saving
  isSaving = signal(false);

  // Confirmation step: null = normal view, 'assign' = confirm existing, 'create' = confirm new
  confirmMode = signal<'assign' | 'create' | null>(null);

  // Debounce
  private searchTimer: number | null = null;

  constructor() {
    effect(() => {
      const d = this.doc();

      // NOTE: Adjust if your model exposes OCR fields differently
      // @ts-ignore
      this.firstName.set(d?.extracted_data?.first_name ?? '');
      // @ts-ignore
      this.lastName.set(d?.extracted_data?.last_name ?? '');

      this.resetSearchState();
      this.isSaving.set(false);
      this.errorMsg.set('');
      this.confirmMode.set(null);
    });
  }

  // -------------------------
  // UI handlers
  // -------------------------

  onFirstNameInput(e: Event): void {
    this.firstName.set((e.target as HTMLInputElement).value);
  }

  onLastNameInput(e: Event): void {
    this.lastName.set((e.target as HTMLInputElement).value);
  }

  onModeChange(e: Event): void {
    const mode = (e.target as HTMLSelectElement).value as CustomerSearchMode;
    this.searchMode.set(mode);
    // Re-run search if a term exists
    if (this.searchTerm().trim().length >= 2) {
      this.startSearch(this.searchTerm().trim(), 1, true);
    }
  }

  onSearchInput(e: Event): void {
    const term = (e.target as HTMLInputElement).value;
    this.searchTerm.set(term);
    this.selectedCustomer.set(null);

    if (this.searchTimer) window.clearTimeout(this.searchTimer);

    const clean = term.trim();
    if (clean.length < 2) {
      this.resetSearchState();
      return;
    }

    this.searchTimer = window.setTimeout(() => {
      this.startSearch(clean, 1, true);
    }, 250);
  }

  selectCustomer(c: Customer): void {
    this.selectedCustomer.set(c);
    this.results.set([]);
    this.hasNext.set(false);
    this.count.set(1);
    this.searchTerm.set(`${c.first_name} ${c.last_name}`.trim());
  }

  clearSelection(): void {
    this.selectedCustomer.set(null);
    this.searchTerm.set('');
    this.resetSearchState();
  }

  // -------------------------
  // Search logic
  // -------------------------

  private resetSearchState(): void {
    this.isSearching.set(false);
    this.results.set([]);
    this.page.set(1);
    this.count.set(0);
    this.hasNext.set(false);
  }

  private startSearch(term: string, page: number, replace: boolean): void {
    this.isSearching.set(true);
    this.errorMsg.set('');

    this.customers.searchCustomersPaginated(term, this.searchMode(), page).subscribe({
      next: (res) => {
        this.isSearching.set(false);
        this.page.set(page);
        this.count.set(res.count);
        this.hasNext.set(!!res.next);

        const nextList = replace ? res.results : [...this.results(), ...res.results];
        this.results.set(nextList);
      },
      error: () => {
        this.isSearching.set(false);
        this.errorMsg.set('Suche fehlgeschlagen.');
      },
    });
  }

  loadMore(): void {
    const term = this.searchTerm().trim();
    if (!term || term.length < 2 || !this.hasNext() || this.isSearching()) return;

    this.startSearch(term, this.page() + 1, false);
  }

  // -------------------------
  // Assign / Create
  // -------------------------

  requestAssign(): void {
    if (!this.selectedCustomer()?.id) {
      this.errorMsg.set('Bitte einen Kunden aus der Liste auswählen.');
      return;
    }
    this.confirmMode.set('assign');
  }

  requestCreate(): void {
    if (!this.firstName().trim() || !this.lastName().trim()) {
      this.errorMsg.set('Bitte Vorname und Nachname ausfüllen.');
      return;
    }
    this.confirmMode.set('create');
  }

  cancelConfirm(): void {
    this.confirmMode.set(null);
  }

  assignToSelectedCustomer(): void {
    const d = this.doc();
    const c = this.selectedCustomer();

    if (!d?.id) {
      this.errorMsg.set('Dokument-ID fehlt.');
      return;
    }
    if (!c?.id) {
      this.errorMsg.set('Bitte einen Kunden aus der Liste auswählen.');
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set('');

    this.documents.assignDocument(d.id, c.id).subscribe({
      next: (updated: CustomerDocument) => {
        this.isSaving.set(false);
        this.assigned.emit(updated);
        this.close.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMsg.set('Zuweisung fehlgeschlagen.');
      },
    });
  }

  createCustomerAndAssign(): void {
    const d = this.doc();
    const fn = this.firstName().trim();
    const ln = this.lastName().trim();

    if (!d?.id) {
      this.errorMsg.set('Dokument-ID fehlt.');
      return;
    }
    if (!fn || !ln) {
      this.errorMsg.set('Bitte Vorname und Nachname ausfüllen.');
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set('');

    // IMPORTANT: adapt payload to your actual create API fields
    this.customers.createCustomer({ first_name: fn, last_name: ln } as any).subscribe({
      next: (newCustomer: Customer) => {
        this.documents.assignDocument(d.id, newCustomer.id).subscribe({
          next: (updated: CustomerDocument) => {
            this.isSaving.set(false);
            this.assigned.emit(updated);
            this.close.emit();
          },
          error: () => {
            this.isSaving.set(false);
            this.errorMsg.set('Kunde erstellt, aber Zuweisung fehlgeschlagen.');
          },
        });
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMsg.set('Kunde konnte nicht erstellt werden.');
      },
    });
  }
}
