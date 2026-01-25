import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CustomerSearch } from '../../components/customer-search/customer-search';
import { CustomerList } from '../../components/customer-list/customer-list';
import { DocumentList } from '../../components/document-list/document-list';
import { RouterLink } from '@angular/router';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';

type SidebarSection = 'overview' | 'customers' | 'documents' | 'settings';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CustomerSearch, CustomerList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  customerService = inject(CustomerService)
  searchTerm = signal<string>('');
  username = computed(() => this.auth.user()?.username ?? '');

  constructor() { }
  year = new Date().getFullYear();
  activeSection = signal<SidebarSection>('overview');
  searchOptions: Record<string, string> = {
    Name: 'Suche nach Namen',
    Kennzeichen: 'Suche nach Auto-Kennzeichen',
    Geburtstag: 'Suche nach Geburtstag',
    Termin: 'Suche nach Termin',
  };

  currentSearch = ""
  currentSearchDescription = ""


  setActive(section: SidebarSection) {
    this.activeSection.set(section);
  }

  setSearch(option: string) {
    this.currentSearch = option
    this.currentSearchDescription = this.searchOptions[option] ?? '';
  }

  customerCount = signal<number>(5);

  ngOnInit(): void {
    this.customerService.getCustomerCount().subscribe({
      next: (res) => this.customerCount.set(res.count),
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
