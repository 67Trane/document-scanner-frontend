import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-customer-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-search.html',
  styleUrl: './customer-search.css',
})
export class CustomerSearch {
  search = output<string>();

  currentTerm = '';

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.currentTerm = target.value;
  }

  onSubmit() {
    const term = this.currentTerm.trim();
    this.search.emit(term);
  }
}
