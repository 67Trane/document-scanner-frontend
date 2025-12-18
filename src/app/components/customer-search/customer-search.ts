import { Component, effect, signal, output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-customer-search",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-search.html",
})
export class CustomerSearch {
  // outgoing event
  search = output<string>();

  // internal state
  private rawValue = signal("");
  private debounceTimer: any = null;

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.rawValue.set(value);

    // manual debounce (simple & predictable)
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(value.trim());
    }, 300);
  }

  onSubmit() {
    // immediate search on button click
    this.search.emit(this.rawValue().trim());
  }
}
