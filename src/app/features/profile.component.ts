import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);

  readonly profile = this.auth.profile;
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  email = '';
  nom = '';
  prenom = '';
  telephone = '';
  password = '';
  confirmPassword = '';

  constructor() {
    effect(() => {
      const current = this.profile();
      if (!current) {
        return;
      }
      this.email = current.email ?? '';
      this.nom = current.nom ?? '';
      this.prenom = current.prenom ?? '';
      this.telephone = current.telephone ?? '';
    });
  }

  save() {
    this.error.set('');
    this.message.set('');

    if (this.password && this.password !== this.confirmPassword) {
      this.error.set('Le mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    this.saving.set(true);
    const payload = {
      email: this.email.trim() || null,
      nom: this.nom.trim() || null,
      prenom: this.prenom.trim() || null,
      telephone: this.telephone.trim() || null,
      password: this.password.trim() || null
    };

    this.auth.updateProfile(payload).subscribe({
      next: () => {
        this.message.set('Profil mis a jour.');
        this.password = '';
        this.confirmPassword = '';
      },
      error: () => {
        this.error.set('Impossible de mettre a jour le profil.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false)
    });
  }
}
