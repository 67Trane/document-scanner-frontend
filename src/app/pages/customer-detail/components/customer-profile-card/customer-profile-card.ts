import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { Customer } from "../../../../models/customer.model";

@Component({
  selector: "app-customer-profile-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-profile-card.html",
  styleUrl: "./customer-profile-card.css",

})
export class CustomerProfileCard {
  customer = input<Customer | null>(null);

  // Stats (keine Logik hier drin – Parent liefert Zahlen)
  contractsCount = input<number>(0);
  vehiclesCount = input<number>(0);
  policiesCount = input<number>(0);
}
