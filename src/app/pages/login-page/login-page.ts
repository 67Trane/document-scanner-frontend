import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { finalize, switchMap } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { DemoLogin } from "../../components/demo-login/demo-login";
import { AppConfig } from "../../runtime-config";
import { StatusWindow } from "../../components/status-window/status-window";

type StatusType = "success" | "error" | "info";

@Component({
  selector: "app-login-page",
  imports: [DemoLogin, StatusWindow],
  standalone: true,
  templateUrl: "./login-page.html",
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  production = AppConfig.production;
  currentYear = new Date().getFullYear();

  toast = {
    visible: false,
    type: "info" as StatusType,
    title: "",
    description: "",
  };

  email = signal("");
  password = signal("");
  rememberMe = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((current) => !current);
  }

  showToast(type: StatusType, title: string, description: string): void {
    this.toast = { visible: true, type, title, description };
  }

  hideToast(): void {
    this.toast = { ...this.toast, visible: false };
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  onRememberMeChange(event: Event): void {
    this.rememberMe.set((event.target as HTMLInputElement).checked);
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const payload = {
      username: this.email().trim(),
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
          this.showToast("success", "Erfolg", "Herzlich willkommen");
          setTimeout(() => {
            this.router.navigateByUrl("/dashboard");
          }, 1000);
        },
        error: (err: { status?: number; error?: { error?: string } }) => {
          const status = err.status ?? 0;
          const message = err.error?.error ?? "Unbekannter Fehler";

          if (status === 400) {
            this.showToast("error", "Fehler", `Falscher Benutzername oder Passwort (${message}, ${status})`);
            return;
          }

          if (status === 500) {
            this.showToast("error", "Fehler", `Server aktuell nicht erreichbar (${message}, ${status})`);
            return;
          }

          this.showToast("error", "Fehler", `${message} (${status})`);
        },
      });
  }

  onForgotPassword(): void {
    this.showToast("info", "Hinweis", "Bitte wenden Sie sich an den Support, um Ihr Passwort zurueckzusetzen.");
  }

  onContactSupport(): void {
    this.showToast("info", "Support", "Kontakt: support@example.com");
  }
}
