import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);
  currentYear = new Date().getFullYear();

  constructor(private router: Router) { }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  async onSubmit() {
    if (!this.email() || !this.password()) {
      return;
    }

    this.isLoading.set(true);

    // Hier deine Login-Logik einfügen
    // Beispiel: await this.authService.login(this.email(), this.password());

    setTimeout(() => {
      this.isLoading.set(false);
      // Nach erfolgreichem Login zum Dashboard navigieren
      this.router.navigate(['/dashboard']);
    }, 1500);
  }

  onForgotPassword() {
    console.log('Passwort vergessen angeklickt');
  }

  onContactSupport() {
    console.log('Support kontaktieren angeklickt');
  }
}

