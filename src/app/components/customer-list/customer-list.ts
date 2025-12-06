import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CustomerService, Customer } from '../../services/customer';
import { catchError, interval, of, switchMap, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerList implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private reloadTimer: number = 10000;


  loading = signal(true);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);

  ngOnInit(): void {
    // Polling alle 10 Sekunden
    interval(this.reloadTimer) // 10000ms = 10s, kannst du anpassen
      .pipe(
        // direkt beim Start einmal ausführen
        startWith(0),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.loading.set(true);
          this.error.set(null);

          return this.customerService.getCustomers().pipe(
            catchError((err) => {
              console.error(err);
              this.error.set('Fehler beim Laden der Kunden.');
              // leere Liste zurückgeben, damit subscribe weiterläuft
              return of([] as Customer[]);
            }),
          );
        }),
      )
      .subscribe((data) => {
        this.customers.set(data);
        this.loading.set(false);
      });
  }

  goToCustomer(id: number): void {
    this.router.navigate(['/customer', id]);
  }
}
