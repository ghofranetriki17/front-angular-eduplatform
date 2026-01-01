import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.css'
})
export class SessionsComponent {
  readonly actions = [
    'Lister les seances a venir pour chaque cours',
    'Verifier les annulations via /api/inscriptions/{id}/annuler',
    'Associer une inscription a une session precise'
  ];
}
