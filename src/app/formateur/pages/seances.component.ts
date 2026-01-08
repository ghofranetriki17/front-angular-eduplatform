import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormateurApiService } from '../../core/services/formateur-api.service';
import { SeanceResponse, SeanceStatut } from '../../core/models/api.models';

@Component({
  selector: 'app-formateur-seances',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seances.component.html',
  styleUrl: './seances.component.css'
})
export class FormateurSeancesComponent {
  readonly seances = signal<SeanceResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly statuts: SeanceStatut[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REPORTEE'];

  constructor(private readonly api: FormateurApiService) {
    this.load();
  }

  updateStatut(seance: SeanceResponse, statut: SeanceStatut) {
    if (seance.statut === statut) {
      return;
    }
    this.api.updateSeanceStatut(seance.id, statut).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Impossible de mettre a jour le statut')
    });
  }

  private load() {
    this.loading.set(true);
    this.error.set('');
    this.api.getSeances().subscribe({
      next: seances => this.seances.set(seances),
      error: () => {
        this.error.set('Erreur lors du chargement');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
