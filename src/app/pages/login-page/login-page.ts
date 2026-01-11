import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { finalize, switchMap } from "rxjs";
import { DemoLogin } from "../../components/demo-login/demo-login";
import { AppConfig } from "../../runtime-config";


@Component({
  selector: "app-login-page",
  imports: [DemoLogin],
  standalone: true,
  templateUrl: "./login-page.html",
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  production = AppConfig.production

  // Your template already uses these signals :contentReference[oaicite:4]{index=4}
  email = signal("");
  password = signal("");
  rememberMe = signal(false);
  currentYear= new Date().getFullYear()

  showPassword = signal(false);
  isLoading = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    this.isLoading.set(true);

    const payload = {
      username: this.email().trim(),   // or map to "username" field
      password: this.password(),
      remember: this.rememberMe(),
    };

    this.auth
      .initCsrf()
      .pipe(
        switchMap(() => this.auth.login(payload)),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl("/dashboard");
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  onForgotPassword() {
    // TODO
  }

  onContactSupport() {
    // TODO
  }
}
