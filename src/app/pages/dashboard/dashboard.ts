import { Component, signal, inject, computed } from '@angular/core';
import { CustomerSearch } from '../../components/customer-search/customer-search';
import { CustomerList } from '../../components/customer-list/customer-list';
import { DocumentList } from '../../components/document-list/document-list';
import { RouterLink } from '@angular/router';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type SidebarSection = 'overview' | 'customers' | 'documents' | 'settings';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CustomerSearch, RouterLink, CustomerList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  searchTerm = signal<string>('');
  username = computed(() => this.auth.user()?.username ?? '');

  constructor() { }
  year = new Date().getFullYear();
  activeSection = signal<SidebarSection>('overview');

  setActive(section: SidebarSection) {
    this.activeSection.set(section);
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
