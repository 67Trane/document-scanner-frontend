import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { CustomerService } from '../../services/customer.service';
import { CustomerSearchMode } from '../../models/customer-search-mode.model';
import { Customer } from '../../models/customer.model';
import { CustomerDocument } from '../../models/document.model';

@Component({
  selector: 'app-document-edit-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './document-edit-modal.html',
  styleUrl: './document-edit-modal.css',
})
export class DocumentEditModal {
  // Services
  private readonly documents = inject(DocumentService);
  private readonly customers = inject(CustomerService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs/Outputs
  doc = input<CustomerDocument | null>(null);
  close = output<void>();
  assigned = output<CustomerDocument>();

  // Active tab: which flow the user is in
  activeTab = signal<'search' | 'create'>('search');

  // Create-form fields (pre-filled from OCR)
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

  // Saving / loading
  isSaving = signal(false);
  isPdfLoading = signal(false);

  // Confirmation step
  confirmMode = signal<'assign' | 'create' | null>(null);

  // Debounce
  private searchTimer: number | null = null;

  constructor() {
    effect(() => {
      const d = this.doc();

      // @ts-ignore
      const fn: string = d?.extracted_data?.first_name ?? '';
      // @ts-ignore
      const ln: string = d?.extracted_data?.last_name ?? '';

      this.firstName.set(fn);
      this.lastName.set(ln);

      this.activeTab.set('search');
      this.resetSearchState();
      this.isSaving.set(false);
      this.errorMsg.set('');
      this.confirmMode.set(null);

      // Auto-search the OCR-extracted name so results are ready immediately
      const fullName = `${fn} ${ln}`.trim();
      if (fullName.length >= 2) {
        this.searchTerm.set(fullName);
        this.startSearch(fullName, 1, true);
      } else {
        this.searchTerm.set('');
      }
    });
  }

  // -------------------------
  // Tab switching
  // -------------------------

  switchTab(tab: 'search' | 'create'): void {
    this.activeTab.set(tab);
    this.errorMsg.set('');
    this.confirmMode.set(null);
  }

  // -------------------------
  // Create form handlers
  // -------------------------

  onFirstNameInput(e: Event): void {
    this.firstName.set((e.target as HTMLInputElement).value);
  }

  onLastNameInput(e: Event): void {
    this.lastName.set((e.target as HTMLInputElement).value);
  }

  // -------------------------
  // Search handlers
  // -------------------------

  onModeChange(e: Event): void {
    const mode = (e.target as HTMLSelectElement).value as CustomerSearchMode;
    this.searchMode.set(mode);
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

  loadMore(): void {
    const term = this.searchTerm().trim();
    if (!term || term.length < 2 || !this.hasNext() || this.isSearching()) return;
    this.startSearch(term, this.page() + 1, false);
  }

  // -------------------------
  // PDF preview
  // -------------------------

  openPdf(): void {
    const d = this.doc();
    if (!d?.id || this.isPdfLoading()) return;
    this.isPdfLoading.set(true);
    this.documents.getDocumentFileBlob(d.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          this.isPdfLoading.set(false);
        },
        error: () => this.isPdfLoading.set(false),
      });
  }

  // -------------------------
  // Assign / Create actions
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

    if (!d?.id) { this.errorMsg.set('Dokument-ID fehlt.'); return; }
    if (!c?.id) { this.errorMsg.set('Bitte einen Kunden auswählen.'); return; }

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

    if (!d?.id) { this.errorMsg.set('Dokument-ID fehlt.'); return; }
    if (!fn || !ln) { this.errorMsg.set('Bitte Vorname und Nachname ausfüllen.'); return; }

    this.isSaving.set(true);
    this.errorMsg.set('');

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

  // -------------------------
  // Internal helpers
  // -------------------------

  private resetSearchState(): void {
    this.isSearching.set(false);
    this.results.set([]);
    this.page.set(1);
    this.count.set(0);
    this.hasNext.set(false);
    this.selectedCustomer.set(null);
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
        this.results.set(replace ? res.results : [...this.results(), ...res.results]);
      },
      error: () => {
        this.isSearching.set(false);
        this.errorMsg.set('Suche fehlgeschlagen.');
      },
    });
  }
}
