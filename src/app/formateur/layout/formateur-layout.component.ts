import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationBellComponent } from '../../shared/notification-bell/notification-bell.component';

interface NavItem {
  label: string;
  path: string;
  description: string;
}

@Component({
  selector: 'app-formateur-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './formateur-layout.component.html',
  styleUrl: './formateur-layout.component.css'
})
export class FormateurLayoutComponent {
  private readonly auth = inject(AuthService);
  readonly profile = this.auth.profile;

  readonly navItems: NavItem[] = [
    { label: 'Tableau de bord', path: '/formateur/dashboard', description: 'Synthese et alertes' },
    { label: 'Cours', path: '/formateur/cours', description: 'Programmes et stats' },
    { label: 'Notes', path: '/formateur/notes', description: 'Saisie et historique' },
    { label: 'Seances', path: '/formateur/seances', description: 'Planning et statuts' },
    { label: 'Profil', path: '/formateur/profil', description: 'Infos personnelles' }
  ];
}
