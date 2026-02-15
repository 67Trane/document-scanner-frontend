import { Component, effect, input, output, signal, inject } from '@angular/core';
import { CustomerDocument } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-edit-modal',
  standalone: true,
  imports: [],
  templateUrl: './document-edit-modal.html',
  styleUrl: './document-edit-modal.css',
})
export class DocumentEditModal {
  /**
   * Modal for validating OCR results and assigning a document to a customer.
   */
  private readonly documents = inject(DocumentService);

  doc = input<CustomerDocument | null>(null);
  close = output<void>();
  assigned = output<CustomerDocument>();

  firstName = signal('');
  lastName = signal('');
  customerId = signal<number | null>(null);
  isSaving = signal(false);
  errorMsg = signal<string>('');

  constructor() {
    effect(() => {
      const currentDocument = this.doc();
      this.firstName.set(currentDocument?.extracted_data?.first_name ?? '');
      this.lastName.set(currentDocument?.extracted_data?.last_name ?? '');
      this.customerId.set(null);
      this.errorMsg.set('');
    });
  }

  /**
   * Keeps template input handlers strongly typed without relying on `$any` in templates.
   */
  onFirstNameInput(event: Event): void {
    this.firstName.set((event.target as HTMLInputElement).value);
  }

  /**
   * Keeps template input handlers strongly typed without relying on `$any` in templates.
   */
  onLastNameInput(event: Event): void {
    this.lastName.set((event.target as HTMLInputElement).value);
  }

  /**
   * Normalizes the optional customer ID so empty values are persisted as `null`.
   */
  onCustomerIdInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customerId.set(value ? Number(value) : null);
  }

  /**
   * Validates and submits the assignment.
   * Keeping this flow in the modal avoids leaking half-edited data to parent state.
   */
  assignToCustomer(): void {
    const d = this.doc();
    const cid = this.customerId();

    if (!d?.id) {
      this.errorMsg.set('Dokument-ID fehlt.');
      return;
    }
    if (!cid) {
      this.errorMsg.set('Bitte eine Customer-ID eingeben.');
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set('');

    this.documents.assignDocument(d.id, cid).subscribe({
      next: (updatedDoc) => {
        this.isSaving.set(false);
        this.assigned.emit(updatedDoc);
        this.close.emit();
      },
      error: (err: { error?: { error?: string } }) => {
        this.isSaving.set(false);
        this.errorMsg.set(err?.error?.error ?? 'Zuweisen fehlgeschlagen.');
      },
    });
  }
}
