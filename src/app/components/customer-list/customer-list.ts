import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService, Customer } from '../../services/customer';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerList {
  private customerService = inject(CustomerService);

  loading = signal(true);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);

  constructor() {
    const customers$ = this.customerService.getCustomers().pipe(
      catchError((err) => {
        console.error(err);
        this.error.set('Fehler beim Laden der Kunden.');
        return of([] as Customer[]);
      }),
    );

    const customersSignal = toSignal(customers$, { initialValue: [] });

    // Reagiert, sobald Daten da sind
    effect(() => {
      const data = customersSignal();
      this.customers.set(data);
      this.loading.set(false);
    });
  }

  private router = inject(Router);

  // loading, error, customers() etc. hast du ja schon

  goToCustomer(id: number) {
    this.router.navigate(['/customer', id]);
  }
}
