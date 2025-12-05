import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CustomerService, Customer } from '../../services/customer';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

interface CustomerDocument {
  id: number;
  title: string;
  page: number;
  totalPages: number;
  imageUrl: string;
  thumbUrl: string;
  pageLabel: string;
}

@Component({
  selector: 'app-customer-detail',
  imports: [CommonModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit{
  customer = signal<Customer | null>(null);

  private customerService = inject(CustomerService);

  ngOnInit(): void {
    const testId = 5; // Hardcoded

    this.customerService.getCustomer(testId).subscribe({
      next: (data) => this.customer.set(data),
      error: (err) => console.error(err),
    });
  }

  selectedCustomer = {
    initials: 'MM',
    name: 'Max Mustermann',
    customerNumber: '2025-000123',
    email: 'max.mustermann@example.com',
    phone: '+49 151 23456789',
    street: 'Musterstraße 12',
    zip: '12345',
    city: 'Musterstadt',
  };

  customerDocuments: CustomerDocument[] = [
    {
      id: 1,
      title: 'Haftpflicht – Versicherungsschein',
      page: 1,
      totalPages: 6,
      imageUrl: 'https://placehold.co/900x1200?text=Haftpflicht+Schein+Seite+1',
      thumbUrl: 'https://placehold.co/200x300?text=S1',
      pageLabel: 'S.1',
    },
    {
      id: 2,
      title: 'Haftpflicht – Bedingungen',
      page: 2,
      totalPages: 6,
      imageUrl: 'https://placehold.co/900x1200?text=Haftpflicht+Seite+2',
      thumbUrl: 'https://placehold.co/200x300?text=S2',
      pageLabel: 'S.2',
    },
    {
      id: 3,
      title: 'Haftpflicht – Nachtrag',
      page: 3,
      totalPages: 6,
      imageUrl: 'https://placehold.co/900x1200?text=Nachtrag',
      thumbUrl: 'https://placehold.co/200x300?text=N',
      pageLabel: 'Nachtrag',
    },
  ];

  selectedDocument: CustomerDocument | null = this.customerDocuments[0];



  // Select another document to show in main image
  selectDocument(doc: CustomerDocument): void {
    this.selectedDocument = doc;
  }

}
