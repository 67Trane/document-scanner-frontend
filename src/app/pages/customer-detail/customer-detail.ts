import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, effect, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { DocumentService } from '../../services/document.service';
import { Customer } from '../../models/customer.model';
import { CustomerDocument } from '../../models/document.model';
import { AppConfig } from '../../config'
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit {
  contracts: CustomerDocument[] = []

  private route = inject(ActivatedRoute);
  customer = signal<Customer | null>(null);
  document = signal<CustomerDocument | null>(null)
  alldocuments = signal<CustomerDocument[]>([]);

  viewerSrc = computed(() => {
    const url = this.document()?.file_url;
    if (!url) return null;

    if (url.startsWith('/')) {
      return `${AppConfig.apiBaseUrl}${url}`;
    }

    return url;
  });

  // basic customer info
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

  // Kennzeichen bleiben wie gehabt
  licensePlates = computed(() => {
    const docs = this.alldocuments();
    const allPlates = docs.flatMap((doc) => doc.license_plates ?? []);
    const filtered = allPlates.filter((plate) => plate && plate.trim().length > 0);
    const unique = Array.from(new Set(filtered));
    return unique;
  });

  hasLicensePlates = computed(() => this.licensePlates().length > 0);

  // Policen hast du schon ähnlich, passt gut:
  policyNumbers = computed(() => {
    const docs = this.alldocuments() ?? [];

    const numbers = docs
      .map((doc) => doc.policy_number ?? '')
      .filter((num) => num && num.trim().length > 0);

    return Array.from(new Set(numbers));
  });

  hasPolicyNumbers = computed(() => this.policyNumbers().length > 0);

  private customerService = inject(CustomerService);
  private documentService = inject(DocumentService);

  ngOnInit(): void {
    const customerid = Number(this.route.snapshot.paramMap.get('id'));
    const documentid = 1

    if (!customerid) {
      console.error('Keine gültige ID in der URL gefunden.');
      return;
    }

    this.documentService.getDocument(documentid).subscribe({
      next: (data) => this.document.set(data),
      error: (err) => console.error(err),
    })

    // this.documentService.getDocuments().subscribe({
    //   next: (data) => this.alldocuments.set(data),
    //   error: (err) => console.error(err),
    // })

    this.documentService.getDocumentsByCustomer(customerid).subscribe((docs) => {
      this.alldocuments.set(docs);
    });

    this.customerService.getCustomer(customerid).subscribe({
      next: (data) => this.customer.set(data),
      error: (err) => console.error(err),
    });
  }

  openContract(contract: CustomerDocument): void {
    if (!contract.file_url) return;

    const url = contract.file_url.startsWith('/')
      ? `${AppConfig.apiBaseUrl}${contract.file_url}`
      : contract.file_url;
      
    window.open(url, '_blank');
  }


  test() {
    console.log(this.viewerSrc())
  }
}
