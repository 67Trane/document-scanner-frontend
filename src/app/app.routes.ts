import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { CustomerDetail } from './pages/customer-detail/customer-detail';
import { LoginPage } from './pages/login-page/login-page';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: "dashboard", component: Dashboard, canActivate: [authGuard] },
  { path: "customer/:id", component: CustomerDetail, canActivate: [authGuard] },
  { path: 'login', component: LoginPage, },
  { path: '**', redirectTo: 'login' },
];
