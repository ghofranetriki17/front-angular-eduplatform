import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-etudiant-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './etudiant-dashboard.component.html',
  styleUrl: './etudiant-dashboard.component.css'
})
export class EtudiantDashboardComponent {
  private readonly auth = inject(AuthService);
  readonly profile = this.auth.profile;
  readonly greeting = computed(() => {
    const p = this.profile();
    if (!p) {
      return 'Hi Étudiant';
    }
    return `Hi Étudiant ${p.prenom} ${p.nom}`;
  });
}
