import { Component, OnDestroy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-customer-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-search.html',
  styleUrl: './customer-search.css',
})
export class CustomerSearch implements OnDestroy {
  search = output<string>();

  currentTerm = '';

  private term$ = new Subject<string>();
  private sub: Subscription;

  constructor() {
    // Emit debounced search term
    this.sub = this.term$
      .pipe(
        map((v) => v.trim()),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe((term) => this.search.emit(term));
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.currentTerm = target.value;
    this.term$.next(this.currentTerm);
  }

  onSubmit() {
    // Emit immediately when user clicks "Suchen"
    this.search.emit(this.currentTerm.trim());
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
