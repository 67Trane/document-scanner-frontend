import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { CustomerDetail } from './pages/customer-detail/customer-detail';
import { LoginPage } from './pages/login-page/login-page';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'customer/:id', component: CustomerDetail },
  { path: 'login', component: LoginPage, },
  { path: '**', redirectTo: 'login' },
];
