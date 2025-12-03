import { Component } from '@angular/core';
import { CustomerSearch } from '../../components/customer-search/customer-search';
import { CustomerList } from '../../components/customer-list/customer-list';
import { DocumentList } from '../../components/document-list/document-list';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CustomerSearch, CustomerList, DocumentList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  year = new Date().getFullYear();

}
