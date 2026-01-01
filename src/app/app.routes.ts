import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'etudiant',
    canActivate: [authGuard],
    data: { roles: ['ETUDIANT'] },
    loadComponent: () => import('./features/etudiant-dashboard.component').then(m => m.EtudiantDashboardComponent)
  },
  {
    path: 'formateur',
    canActivate: [authGuard],
    data: { roles: ['FORMATEUR'] },
    loadComponent: () => import('./features/formateur-dashboard.component').then(m => m.FormateurDashboardComponent)
  },
  { path: '**', redirectTo: 'login' }
];
