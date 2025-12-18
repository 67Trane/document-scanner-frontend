import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
  selector: "app-customer-header",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-header.html",
  styleUrl: "./customer-header.css",

})
export class CustomerHeader {
  fullName = input<string>("");

  // Optional: If you want to wire the back button later
  // back = output<void>();
}
