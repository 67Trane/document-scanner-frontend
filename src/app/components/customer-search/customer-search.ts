import { Component, output, signal } from "@angular/core";
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
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Debounces text input to reduce backend requests while the user is still typing.
   */
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rawValue.set(value);

    // manual debounce (simple & predictable)
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(value.trim());
    }, 300);
  }

  onSubmit(): void {
    // immediate search on button click
    this.search.emit(this.rawValue().trim());
  }
}
