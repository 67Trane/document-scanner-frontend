import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  city: string;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerList {
  customers: Customer[] = [
    { id: 1, first_name: 'Peter', last_name: 'Müller', city: 'Berlin' },
    { id: 2, first_name: 'Anna', last_name: 'Schmidt', city: 'Hamburg' },
    { id: 3, first_name: 'Mehmet', last_name: 'Yilmaz', city: 'München' },
  ];
}
