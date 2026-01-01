import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent {
  readonly checkpoints = [
    'Verifier rapidement les notes par cours',
    'Identifier les evaluations manquantes ou en attente',
    'Suivre la moyenne globale par session'
  ];
}
