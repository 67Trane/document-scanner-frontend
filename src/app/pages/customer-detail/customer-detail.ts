import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, effect, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { DocumentService } from '../../services/document.service';
import { Customer } from '../../models/customer.model';
import { CustomerDocument } from '../../models/document.model';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit {

  contracts: CustomerDocument[] = []


  private route = inject(ActivatedRoute);
  customer = signal<Customer | null>(null);
  document = signal<CustomerDocument | null>(null)
  alldocuments = signal<CustomerDocument[]>([]);

  fullName = computed(() => {
    const c = this.customer();
    return c ? `${c.first_name} ${c.last_name}` : '';
  });


  licensePlates = computed(() => {
    const docs = this.alldocuments();
    const allPlates = docs.flatMap((doc) => doc.license_plates ?? []);
    const filtered = allPlates.filter((plate) => plate && plate.trim().length > 0);
    const unique = Array.from(new Set(filtered));
    return unique;
  });

  contactItems = computed(() => {
    const c = this.customer();

    return [
      {
        label: 'E-Mail',
        value: c?.email?.trim() || null,
      },
      {
        label: 'Telefon',
        value: c?.phone?.trim() || null,
      },
    ];
  });


  policyNumbers = computed(() => {
    const docs = this.alldocuments() ?? [];

    const numbers = docs
      .map((doc) => doc.policy_number ?? '')
      .filter((num) => num && num.trim().length > 0);

    return Array.from(new Set(numbers));
  });

  hasPolicyNumbers = computed(() => this.policyNumbers().length > 0);




  // nice string for the template
  licensePlatesLabel = computed(() => {
    console.log(this.alldocuments())
    const plates = this.licensePlates();
    return plates.length > 0 ? plates.join(', ') : '-';
  });

  hasLicensePlates = computed(() => this.licensePlates().length > 0);




  address = computed(() => {
    const c = this.customer();
    return c ? `${c.street}, ${c.zip_code} ${c.city}` : '';
  });




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


  openPdf(): void {

    const url = this.document()?.file_url;
    if (!url) {
      console.warn('No file_url available for document');
      return;
    }
    window.open(url, '_blank');
  }

  openContract(contract: CustomerDocument): void {
    this.openPdf();
  }


  test() {
    console.log(this.alldocuments())
  }
}
