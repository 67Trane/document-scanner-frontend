import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerSearch } from '../../components/customer-search/customer-search';
import { CustomerList } from '../../components/customer-list/customer-list';
import { Router } from '@angular/router';
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
  /**
   * Dashboard shell that coordinates customer search and unassigned document assignment.
   */
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly documentService = inject(DocumentService);
  private readonly destroyRef = inject(DestroyRef);

  searchTerm = signal<string>('');
  username = computed(() => this.auth.user()?.username ?? '');
  unassignedDocuments = signal<CustomerDocument[]>([]);
  selectedDocument = signal<CustomerDocument | null>(null);
  isEditOpen = signal(false);
  customerCount = signal<number>(0);

  currentSearch = signal<CustomerSearchMode>('name');
  currentSearchDescription = computed(() => this.searchOptions[this.currentSearch()] ?? '');

  readonly searchOptions: Record<CustomerSearchMode, string> = {
    name: 'Suche nach Namen',
    license: 'Suche nach Auto-Kennzeichen',
    birthdate: 'Suche nach Geburtstag',
  };

  readonly searchLabel = computed(() => {
    return {
      name: 'Name',
      license: 'Kennzeichen',
      birthdate: 'Geburtstag',
    }[this.currentSearch()];
  });

  /**
   * Opens the document assignment dialog with the selected document context.
   */
  openEdit(doc: CustomerDocument): void {
    this.selectedDocument.set(doc);
    this.isEditOpen.set(true);
  }

  closeEdit(): void {
    this.isEditOpen.set(false);
    this.selectedDocument.set(null);
  }

  activeSection = signal<SidebarSection>('overview');

  setActive(section: SidebarSection): void {
    this.activeSection.set(section);
  }

  /**
   * Refreshes the "unassigned documents" list after initial load and assignments.
   */
  getUnassignedDocuments(): void {
    this.documentService.getUnassignedDocuments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.unassignedDocuments.set(data.results);
      },
      error: () => {
        this.unassignedDocuments.set([]);
      }
    });
  }

  setSearch(option: CustomerSearchMode): void {
    this.currentSearch.set(option);
  }

  ngOnInit(): void {
    this.customerService.getCustomerCount().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.customerCount.set(res.count);
        this.getUnassignedDocuments();
      },
      error: () => {
        this.customerCount.set(0);
      },
    });
  }

  logOut(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onAssigned(): void {
    this.getUnassignedDocuments();
  }
}
