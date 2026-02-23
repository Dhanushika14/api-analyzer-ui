import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AnalyticsDetailComponent } from './components/analytics-detail/analytics-detail';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent
   
  },
  {
    path: 'analytics/:apiName',
    component: AnalyticsDetailComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];