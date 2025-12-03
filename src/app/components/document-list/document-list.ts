import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DocumentItem {
  id: number;
  title: string;
  document_type: string;
  customer_name: string;
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentList {
  documents: DocumentItem[] = [
    { id: 1, title: 'KFZ-Police 2025', document_type: 'policy', customer_name: 'Müller, Peter' },
    { id: 2, title: 'Hausrat Rechnung 2024', document_type: 'invoice', customer_name: 'Schmidt, Anna' },
    { id: 3, title: 'Kündigung Haftpflicht', document_type: 'cancellation', customer_name: 'Yilmaz, Mehmet' },
  ];
}
