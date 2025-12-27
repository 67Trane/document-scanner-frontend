import { CommonModule } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-customer-header",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-header.html",
  styleUrl: "./customer-header.css",
})
export class CustomerHeader {
  private router = inject(Router);
  fullName = input<string>("");

  goHome() {
    this.router.navigateByUrl("/dashboard");
  }
}
