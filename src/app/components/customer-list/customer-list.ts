import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, DestroyRef, input, ChangeDetectionStrategy } from '@angular/core';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { catchError, interval, of, switchMap, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';



@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerList implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private reloadTimer = 50000; // 10000 = 10 seconds


  searchTerm = input<string>('');

  loading = signal(true);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);

  ngOnInit(): void {
    interval(this.reloadTimer)
      .pipe(
        startWith(0),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.loading.set(true);
          this.error.set(null);

          const term = this.searchTerm().trim();

          const source$ = term
            ? this.customerService.searchCustomers(term)
            : this.customerService.getCustomers();

          return source$.pipe(
            catchError((err) => {
              console.error(err);
              this.error.set('Fehler beim Laden der Kunden.');
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
