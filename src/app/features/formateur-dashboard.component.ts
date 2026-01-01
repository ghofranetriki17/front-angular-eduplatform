import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-formateur-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formateur-dashboard.component.html',
  styleUrl: './formateur-dashboard.component.css'
})
export class FormateurDashboardComponent {
  private readonly auth = inject(AuthService);
  readonly profile = this.auth.profile;
  readonly greeting = computed(() => {
    const p = this.profile();
    if (!p) {
      return 'Hi Formateur';
    }
    return `Hi Formateur ${p.prenom} ${p.nom}`;
  });
}
