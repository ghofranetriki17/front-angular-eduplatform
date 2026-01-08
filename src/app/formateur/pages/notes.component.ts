import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormateurApiService } from '../../core/services/formateur-api.service';
import { CoursResponse, EtudiantResponse, NoteResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-formateur-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class FormateurNotesComponent {
  readonly cours = signal<CoursResponse[]>([]);
  readonly selectedCours = signal<CoursResponse | null>(null);
  readonly etudiants = signal<EtudiantResponse[]>([]);
  readonly notes = signal<NoteResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly types = ['EXAMEN', 'CONTROLE_CONTINU', 'TP', 'PROJET', 'ORAL'];

  etudiantId = '';
  valeur = '';
  typeEvaluation = 'EXAMEN';
  commentaire = '';
  coefficient = '';

  readonly notesFiltrees = computed(() => {
    const selected = this.selectedCours();
    if (!selected) {
      return [] as NoteResponse[];
    }
    return this.notes().filter(note => note.coursCode === selected.code);
  });

  constructor(private readonly api: FormateurApiService) {
    this.load();
  }

  selectCours(cours: CoursResponse) {
    this.selectedCours.set(cours);
    this.api.getEtudiants(cours.code).subscribe({
      next: etudiants => this.etudiants.set(etudiants)
    });
    this.loadNotes();
  }

  submit() {
    const selected = this.selectedCours();
    if (!selected || !this.etudiantId || !this.valeur) {
      this.error.set('Tous les champs obligatoires doivent etre remplis');
      return;
    }

    this.api
      .createNote({
        etudiantId: Number(this.etudiantId),
        coursCode: selected.code,
        valeur: Number(this.valeur),
        typeEvaluation: this.typeEvaluation,
        commentaire: this.commentaire || null,
        coefficient: this.coefficient ? Number(this.coefficient) : null
      })
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadNotes();
        },
        error: () => this.error.set('Impossible de sauvegarder cette note')
      });
  }

  private load() {
    this.loading.set(true);
    this.api.getCours().subscribe({
      next: cours => {
        this.cours.set(cours);
        if (cours.length) {
          this.selectCours(cours[0]);
        }
      },
      complete: () => this.loading.set(false)
    });
  }

  private loadNotes() {
    this.api.getNotes().subscribe({
      next: notes => this.notes.set(notes)
    });
  }

  private resetForm() {
    this.etudiantId = '';
    this.valeur = '';
    this.typeEvaluation = 'EXAMEN';
    this.commentaire = '';
    this.coefficient = '';
    this.error.set('');
  }
}
