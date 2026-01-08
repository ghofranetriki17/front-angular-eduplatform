import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface NavItem {
  label: string;
  path: string;
  description: string;
}

@Component({
  selector: 'app-etudiant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './etudiant-layout.component.html',
  styleUrl: './etudiant-layout.component.css'
})
export class EtudiantLayoutComponent {
  private readonly auth = inject(AuthService);
  readonly profile = this.auth.profile;

  readonly navItems: NavItem[] = [
    { label: 'Tableau de bord', path: '/etudiant/dashboard', description: 'Vue globale et raccourcis' },
    { label: 'Cours', path: '/etudiant/cours', description: 'Modules et inscriptions' },
    { label: 'Notes', path: '/etudiant/notes', description: 'Moyennes et historique' },
    { label: 'Planning', path: '/etudiant/sessions', description: 'Seances et statut' },
    { label: 'Profil', path: '/etudiant/profil', description: 'Infos personnelles' }
  ];
}
