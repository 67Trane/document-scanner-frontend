import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { DocumentService } from '../../services/document.service';
import { Customer } from '../../models/customer.model';
import { CustomerDocument } from '../../models/document.model';

type ContractType = 'haftpflicht' | 'hausrat' | 'kfz';

interface UiContract {
  id: ContractType;
  title: string;
  subtitle: string;
  status: 'aktiv' | 'ruhend';
}


@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail implements OnInit {

  contracts: UiContract[] = [
    {
      id: 'haftpflicht',
      title: 'Haftpflicht',
      subtitle: 'Läuft seit 01.03.2020 · Beitrag 12,90 € / Monat',
      status: 'aktiv',
    },
    {
      id: 'hausrat',
      title: 'Hausrat',
      subtitle: 'Läuft seit 15.09.2022 · Beitrag 24,50 € / Monat',
      status: 'aktiv',
    },
    {
      id: 'kfz',
      title: 'KFZ',
      subtitle: 'ruhend seit 01.01.2024',
      status: 'ruhend',
    },
  ];

  private route = inject(ActivatedRoute);
  customer = signal<Customer | null>(null);
  document = signal<CustomerDocument | null>(null)

  private customerService = inject(CustomerService);
  private documentService = inject(DocumentService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const documentid = 1

    if (!id) {
      console.error('Keine gültige ID in der URL gefunden.');
      return;
    }

    this.documentService.getDocument(documentid).subscribe({
      next: (data) => this.document.set(data),
      error: (err) => console.error(err),
    })

    this.customerService.getCustomer(id).subscribe({
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

  openContract(contract: UiContract): void {
    // later you can switch by contract.id and open different documents
    this.openPdf();
  }


  selectDocument(test: string) {

    console.log(test)
  }
}
