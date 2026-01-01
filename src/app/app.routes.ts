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
    loadComponent: () => import('./etudiant/layout/etudiant-layout.component').then(m => m.EtudiantLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/etudiant-dashboard.component').then(m => m.EtudiantDashboardComponent)
      },
      {
        path: 'notes',
        loadComponent: () => import('./etudiant/pages/notes.component').then(m => m.NotesComponent)
      },
      {
        path: 'cours',
        loadComponent: () => import('./etudiant/pages/cours.component').then(m => m.CoursComponent)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./etudiant/pages/sessions.component').then(m => m.SessionsComponent)
      }
    ]
  },
  {
    path: 'formateur',
    canActivate: [authGuard],
    data: { roles: ['FORMATEUR'] },
    loadComponent: () => import('./features/formateur-dashboard.component').then(m => m.FormateurDashboardComponent)
  },
  { path: '**', redirectTo: 'login' }
];
