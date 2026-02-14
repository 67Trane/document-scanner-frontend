import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { finalize, switchMap } from "rxjs";
import { DemoLogin } from "../../components/demo-login/demo-login";
import { AppConfig } from "../../runtime-config";
import { StatusWindow } from "../../components/status-window/status-window";

type StatusType = 'success' | 'error' | 'info';
@Component({
  selector: "app-login-page",
  imports: [DemoLogin, StatusWindow],
  standalone: true,
  templateUrl: "./login-page.html",
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  production = AppConfig.production
  toast = {
    visible: false,
    type: 'info' as StatusType,
    title: '',
    description: '',
  };

  email = signal("");
  password = signal("");
  rememberMe = signal(false);
  currentYear = new Date().getFullYear()
  type = "error"
  showError = false

  showPassword = signal(false);
  isLoading = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  showToast(type: StatusType, title: string, description: string): void {
    this.toast = { visible: true, type, title, description };
  }

  hideToast(): void {
    this.toast = { ...this.toast, visible: false };
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
          this.showToast('success', 'Success✔️', `Herzlich Wilkommen`);
          setTimeout(() => {
            this.router.navigateByUrl("/dashboard");
          }, 1000);
        },
        error: (err) => {
          if (err.status == 400) {
            this.showToast('error', '❌Fehler!', `Falscher Benutzername oder Passwort, (${err.error.error}, ${err.status})`);
          } else if (err.status == 500) {
            this.showToast('error', '❌Fehler!', `Server aktuell nicht erreichbar, (${err.error.error}, ${err.status})`);
          } else {
            this.showToast('error', '❌Fehler!', `${err.error.error}, ${err.status}`);
          }
          
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
