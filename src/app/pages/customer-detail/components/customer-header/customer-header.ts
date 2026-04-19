import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { Router } from "@angular/router";
import { ThemeService } from "../../../../services/theme.service";
import { AuthService } from "../../../../services/auth.service";

@Component({
  selector: "app-customer-header",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-header.html",
  styleUrl: "./customer-header.css",
})
export class CustomerHeader {
  private router = inject(Router);
  private auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  fullName = input<string>("");
  username = computed(() => this.auth.user()?.username ?? '');

  goHome() {
    this.router.navigateByUrl("/dashboard");
  }
}
