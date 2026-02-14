import { Component, effect, input, output, signal, inject } from '@angular/core';
import { CustomerDocument } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-edit-modal',
  imports: [],
  templateUrl: './document-edit-modal.html',
  styleUrl: './document-edit-modal.css',
})
export class DocumentEditModal {
  private documents = inject(DocumentService);

  doc = input<CustomerDocument | null>(null);
  close = output<void>();


  assigned = output<CustomerDocument>(); // let parent refresh list / UI

  firstName = signal('');
  lastName = signal('');


  customerId = signal<number | null>(null);
  isSaving = signal(false);
  errorMsg = signal<string>('');

  constructor() {
    effect(() => {
      const d = this.doc();
      this.firstName.set((d as any)?.extracted_data?.first_name ?? '');
      this.lastName.set((d as any)?.extracted_data?.last_name ?? '');
      this.customerId.set(null);
      this.errorMsg.set('');
    });
  }

  assignToCustomer() {
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
      error: (err) => {
        this.isSaving.set(false);
        this.errorMsg.set(err?.error?.error ?? 'Zuweisen fehlgeschlagen.');
      },
    });
  }
}
