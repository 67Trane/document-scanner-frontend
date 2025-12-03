import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { CustomerDetail } from './pages/customer-detail/customer-detail';
import { DocumentDetail } from './pages/document-detail/document-detail';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'customers/:id', component: CustomerDetail },
  { path: 'documents/:id', component: DocumentDetail },
];
