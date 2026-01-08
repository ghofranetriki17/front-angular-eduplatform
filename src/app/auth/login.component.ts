import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  emailError = '';
  passwordError = '';
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  submit(): void {
    this.emailError = '';
    this.passwordError = '';
    this.error = '';

    if (!this.email) {
      this.emailError = 'Email requis';
      return;
    }

    if (!this.password) {
      this.passwordError = 'Mot de passe requis';
      return;
    }

    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: profile => {
        this.loading = false;
        const redirect = this.route.snapshot.queryParamMap.get('redirectTo');
        const target = redirect ?? (profile.role === 'FORMATEUR' ? '/formateur' : '/etudiant');
        this.router.navigate([target]);
      },
      error: () => {
        this.loading = false;
        this.error = 'Identifiants invalides';
        this.emailError = 'Email requis';
        this.passwordError = 'Mot de passe requis';
      }
    });
  }
}
