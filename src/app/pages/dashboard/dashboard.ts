import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CustomerSearch } from '../../components/customer-search/customer-search';
import { CustomerList } from '../../components/customer-list/customer-list';
import { DocumentList } from '../../components/document-list/document-list';
import { RouterLink } from '@angular/router';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { CustomerSearchMode } from '../../models/customer-search-mode.model';
import { DocumentService } from '../../services/document.service';
import { CustomerDocument } from '../../models/document.model';
import { JsonPipe } from '@angular/common';
import { DocumentEditModal } from '../../components/document-edit-modal/document-edit-modal';

type SidebarSection = 'overview' | 'customers' | 'documents' | 'settings';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CustomerSearch, CustomerList, JsonPipe, DocumentEditModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  customerService = inject(CustomerService)
  documentService = inject(DocumentService)
  searchTerm = signal<string>('');
  username = computed(() => this.auth.user()?.username ?? '');
  unassignedDocuments = signal<CustomerDocument[]>([]);

  selectedDocument = signal<CustomerDocument | null>(null);
  isEditOpen = signal(false);

  openEdit(doc: CustomerDocument) {
    this.selectedDocument.set(doc);
    this.isEditOpen.set(true);
  }

  closeEdit() {
    this.isEditOpen.set(false);
    this.selectedDocument.set(null);
  }


  constructor() { }
  year = new Date().getFullYear();
  activeSection = signal<SidebarSection>('overview');
  searchOptions: Record<string, string> = {
    name: 'Suche nach Namen',
    license: 'Suche nach Auto-Kennzeichen',
    birthdate: 'Suche nach Geburtstag',
    appointment_at: 'Suche nach Termin',
  };

  currentSearch: CustomerSearchMode = "name"
  currentSearchDescription = ""
  customerCount = signal<number>(5);

  get searchLabel(): string {
    return {
      name: "Name",
      license: "Kennzeichen",
      birthdate: "Geburtstag",
    }[this.currentSearch];
  }

  setActive(section: SidebarSection) {
    this.activeSection.set(section);
  }

  getUnassignedDocuments() {
    this.documentService.getUnassignedDocuments().subscribe({
      next: (data) => {
        console.log('UNASSIGNED:', data);
        this.unassignedDocuments.set(data.results)
        console.log('UNASSIGNED:', this.unassignedDocuments());
      },
      error: (err) => {
        console.error('ERROR:', err);
      }
    });
  }


  currentSearchType: string = 'all';

  setSearch(option: CustomerSearchMode) {
    this.currentSearchType = option;
    this.currentSearch = option
    this.currentSearchDescription = this.searchOptions[option] ?? '';
  }

  ngOnInit(): void {
    this.customerService.getCustomerCount().subscribe({
      next: (res) => { this.customerCount.set(res.count); this.getUnassignedDocuments() },
      error: (err) => console.error('getCustomerCount failed', err),
    });
  }


  logOut() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigateByUrl("/login");
      },
      error: (err) => console.error("Logout failed", err),
    });
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
  }



}
