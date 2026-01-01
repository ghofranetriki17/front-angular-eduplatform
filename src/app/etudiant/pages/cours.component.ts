import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cours.component.html',
  styleUrl: './cours.component.css'
})
export class CoursComponent {
  readonly actions = [
    'Lister les cours actifs pour preparer le semestre',
    'Afficher les cours archives avec ?actifs=false',
    'Ouvrir le detail d un cours via /api/cours/{code}'
  ];
}
