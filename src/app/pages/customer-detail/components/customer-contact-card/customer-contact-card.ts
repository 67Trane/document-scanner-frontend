import { CommonModule } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { Customer } from "../../../../models/customer.model";

@Component({
  selector: "app-customer-contact-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-contact-card.html",
  styleUrl: "./customer-contact-card.css",

})
export class CustomerContactCard {
  // Used for skeleton/conditional rendering (keeps the original behavior)
  customer = input<Customer | null>(null);

  // Values (Parent liefert die fertigen Strings)
  email = input<string | null>(null);
  phone = input<string | null>(null);
  addressLine1 = input<string>("");
  addressLine2 = input<string>("");

  // Arrays
  licensePlates = input<string[]>([]);
  policyNumbers = input<string[]>([]);

  // Flags (computed)
  hasLicensePlates = computed(() => this.licensePlates().length > 0);
  hasPolicyNumbers = computed(() => this.policyNumbers().length > 0);
}
