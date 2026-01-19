import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly profile = this.auth.profile;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly profileLink = computed(() => {
    const current = this.profile();
    if (!current) {
      return '';
    }
    if (current.role === 'ETUDIANT') {
      return '/etudiant/profil';
    }
    if (current.role === 'FORMATEUR') {
      return '/formateur/profil';
    }
    return '';
  });

  constructor() {
    this.auth.ensureProfile().subscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
