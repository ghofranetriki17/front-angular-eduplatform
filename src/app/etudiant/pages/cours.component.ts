import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EtudiantApiService } from '../../core/services/etudiant-api.service';
import { CoursResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-cours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cours.component.html',
  styleUrl: './cours.component.css'
})
export class CoursComponent {
  readonly cours = signal<CoursResponse[]>([]);
  readonly disponibles = signal<CoursResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor(private readonly api: EtudiantApiService) {
    this.load();
  }

  inscrire(cours: CoursResponse) {
    this.api.inscrire(cours.code).subscribe({
      next: () => this.load(),
      error: () => this.error.set("Impossible d'inscrire ce cours")
    });
  }

  private load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin([this.api.getCours(), this.api.getCoursDisponibles()]).subscribe({
      next: ([cours, disponibles]) => {
        this.cours.set(cours);
        this.disponibles.set(disponibles);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des cours');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
