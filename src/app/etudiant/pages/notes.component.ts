import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EtudiantApiService } from '../../core/services/etudiant-api.service';
import { CoursMoyenneResponse, NoteResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent {
  readonly notes = signal<NoteResponse[]>([]);
  readonly moyennes = signal<CoursMoyenneResponse[]>([]);
  readonly loading = signal(true);

  constructor(private readonly api: EtudiantApiService) {
    this.load();
  }

  private load() {
    this.loading.set(true);
    forkJoin([this.api.getNotes(), this.api.getMoyennes()]).subscribe({
      next: ([notes, moyennes]) => {
        this.notes.set(notes);
        this.moyennes.set(moyennes);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }
}
