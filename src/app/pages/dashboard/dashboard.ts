import { Component, signal, inject } from '@angular/core';
import { CustomerSearch } from '../../components/customer-search/customer-search';
import { CustomerList } from '../../components/customer-list/customer-list';
import { DocumentList } from '../../components/document-list/document-list';
import { RouterLink } from '@angular/router';
import { Router, RouterOutlet } from '@angular/router';

type SidebarSection = 'overview' | 'customers' | 'documents' | 'settings';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CustomerSearch, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private router = inject(Router);

  constructor() {
    console.log('Router config: ', this.router.config);
  }
  year = new Date().getFullYear();
  activeSection = signal<SidebarSection>('overview');

  setActive(section: SidebarSection) {
    this.activeSection.set(section);
    
  }
}
