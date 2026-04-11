import { Component, computed, input, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CustomerSearchMode } from "../../models/customer-search-mode.model";

const PLACEHOLDERS: Record<CustomerSearchMode, string> = {
  name:      "z.B. Max Mustermann",
  license:   "z.B. M-AB 1234",
  birthdate: "z.B. 06.03.1990 oder 03.1990 oder 1990",
};

@Component({
  selector: "app-customer-search",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-search.html",
})
export class CustomerSearch {
  mode = input<CustomerSearchMode>("name");
  placeholder = computed(() => PLACEHOLDERS[this.mode()]);

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
