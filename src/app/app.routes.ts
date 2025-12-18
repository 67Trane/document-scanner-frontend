import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { CustomerDetail } from './pages/customer-detail/customer-detail';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'customer/:id', component: CustomerDetail },
];
