import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EtudiantApiService } from '../../core/services/etudiant-api.service';
import { InscriptionResponse, SeanceResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.css'
})
export class SessionsComponent {
  readonly seances = signal<SeanceResponse[]>([]);
  readonly inscriptions = signal<InscriptionResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  private readonly today = new Date();
  private readonly start = this.toIsoDate(this.today);
  private readonly end = this.toIsoDate(new Date(this.today.getTime() + 21 * 24 * 60 * 60 * 1000));

  constructor(private readonly api: EtudiantApiService) {
    this.load();
  }

  annuler(id: number) {
    this.api.annulerInscription(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Impossible de supprimer cette inscription')
    });
  }

  private load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin([
      this.api.getSeances(this.start, this.end),
      this.api.getInscriptions()
    ]).subscribe({
      next: ([seances, inscriptions]) => {
        this.seances.set(seances);
        this.inscriptions.set(inscriptions);
      },
      error: () => {
        this.error.set('Erreur lors du chargement');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  private toIsoDate(date: Date) {
    return date.toISOString().split('T')[0];
  }
}
