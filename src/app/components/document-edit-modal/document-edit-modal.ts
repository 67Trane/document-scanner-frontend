import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerDocument } from '../../models/document.model';


@Component({
  selector: 'app-document-edit-modal',
  imports: [],
  templateUrl: './document-edit-modal.html',
  styleUrl: './document-edit-modal.css',
})
export class DocumentEditModal {
  doc = input<CustomerDocument | null>(null);
  close = output<void>();

  firstName = signal('');
  lastName = signal('');

  constructor() {
    effect(() => {
      const d = this.doc();
      this.firstName.set((d as any)?.extracted_data?.first_name ?? '');
      this.lastName.set((d as any)?.extracted_data?.last_name ?? '');
    });
  }
}

