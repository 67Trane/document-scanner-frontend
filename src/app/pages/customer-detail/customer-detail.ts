import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { DocumentService } from '../../services/document.service';
import { Customer } from '../../models/customer.model';
import { CustomerDocument } from '../../models/document.model';
import { AppConfig } from '../../config';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';


// -------------------- Notes Types --------------------
// Note: Comments in English as requested.
type CustomerNote = {
  id: string;
  text: string;
  createdAt: Date;
};

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule, RouterLink],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private documentService = inject(DocumentService);

  // Signals
  customer = signal<Customer | null>(null);
  document = signal<CustomerDocument | null>(null);
  alldocuments = signal<CustomerDocument[]>([]);

  // Current date for footer
  today = new Date();

  // Computed: PDF Viewer Source
  viewerSrc = computed(() => {
    const url = this.document()?.file_url;
    if (!url) return null;

    if (url.startsWith('/')) {
      return `${AppConfig.apiBaseUrl}${url}`;
    }

    return url;
  });

  // -------------------- Notes Signals --------------------
  notes = signal<CustomerNote[]>([]);
  noteDraft = signal<string>('');


  // -------------------- Notes Methods --------------------
  addNote(): void {
    const text = this.noteDraft().trim();
    if (!text) return;

    const next: CustomerNote = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date(),
    };

    // Newest first
    this.notes.set([next, ...this.notes()]);
    this.noteDraft.set('');
  }

  deleteNote(id: string): void {
    this.notes.set(this.notes().filter((n) => n.id !== id));
  }

  onNoteKeydown(event: KeyboardEvent): void {
    // Enter saves, Shift+Enter creates a new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addNote();
    }
  }

  // -------------------- Upload Methods --------------------
  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset input so selecting the same file again triggers change
    input.value = '';

    // TODO: Connect to your backend upload endpoint via DocumentService
    // For now: just log and you can wire it to an API method.
    console.log('Selected file:', file.name, file.type, file.size);

    // Example idea (only if you have such a method):
    // this.documentService.uploadCustomerDocument(customerId, file).subscribe(...)
  }


  // Computed: Basic Customer Info
  email = computed(() => this.customer()?.email?.trim() || null);

  fullName = computed(() => {
    const c = this.customer();
    return c ? `${c.first_name} ${c.last_name}` : '';
  });

  phone = computed(() => this.customer()?.phone?.trim() || null);

  addressLine1 = computed(() => this.customer()?.street || '');

  addressLine2 = computed(() => {
    const c = this.customer();
    if (!c) {
      return '';
    }
    return `${c.zip_code} ${c.city}`.trim();
  });

  // Computed: License Plates
  licensePlates = computed(() => {
    const docs = this.alldocuments();
    const allPlates = docs.flatMap((doc) => doc.license_plates ?? []);
    const filtered = allPlates.filter((plate) => plate && plate.trim().length > 0);
    const unique = Array.from(new Set(filtered));
    return unique;
  });

  hasLicensePlates = computed(() => this.licensePlates().length > 0);

  // Computed: Policy Numbers
  policyNumbers = computed(() => {
    const docs = this.alldocuments() ?? [];
    const numbers = docs
      .map((doc) => doc.policy_number ?? '')
      .filter((num) => num && num.trim().length > 0);
    return Array.from(new Set(numbers));
  });

  hasPolicyNumbers = computed(() => this.policyNumbers().length > 0);

  // Computed: Active Contracts Count
  activeContractsCount = computed(() => {
    return this.alldocuments().filter(
      (doc) => doc.contract_status === 'aktiv'
    ).length;
  });

  ngOnInit(): void {
    const customerid = Number(this.route.snapshot.paramMap.get('id'));

    if (!customerid) {
      console.error('Keine gültige ID in der URL gefunden.');
      return;
    }

    // Load customer data
    this.customerService.getCustomer(customerid).subscribe({
      next: (data) => this.customer.set(data),
      error: (err) => console.error('Fehler beim Laden des Kunden:', err),
    });

    // Load customer documents
    this.documentService.getDocumentsByCustomer(customerid).subscribe({
      next: (docs) => {
        this.alldocuments.set(docs);
        // Automatically select first document if available
        if (docs.length > 0) {
          this.document.set(docs[0]);
        }
      },
      error: (err) => console.error('Fehler beim Laden der Dokumente:', err),
    });
  }

  /**
   * Opens the selected contract in a new tab
   */
  openContract(contract: CustomerDocument): void {
    if (!contract.file_url) return;

    const url = contract.file_url.startsWith('/')
      ? `${AppConfig.apiBaseUrl}${contract.file_url}`
      : contract.file_url;

    window.open(url, '_blank');
  }

  /**
   * Sets the contract for preview in the PDF viewer
   */
  openContractPreview(contract: CustomerDocument): void {
    this.document.set(contract);
  }

  /**
   * Downloads the current document
   */
  downloadDocument(): void {
    const doc = this.document();
    if (!doc?.file_url) return;

    const url = doc.file_url.startsWith('/')
      ? `${AppConfig.apiBaseUrl}${doc.file_url}`
      : doc.file_url;

    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.contract_typ}_${doc.policy_number || 'dokument'}.pdf`;
    link.click();
  }
}