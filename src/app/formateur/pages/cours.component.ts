import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FormateurApiService } from '../../core/services/formateur-api.service';
import { CoursResponse, CoursStatsResponse, EtudiantResponse } from '../../core/models/api.models';
import { NavbarNotificationService } from '../../core/services/navbar-notification.service';

@Component({
  selector: 'app-formateur-cours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cours.component.html',
  styleUrl: './cours.component.css'
})
export class FormateurCoursComponent {
  private readonly navNotification = inject(NavbarNotificationService);
  
  readonly cours = signal<CoursResponse[]>([]);
  readonly selected = signal<CoursResponse | null>(null);
  readonly stats = signal<CoursStatsResponse | null>(null);
  readonly etudiants = signal<EtudiantResponse[]>([]);
  readonly loading = signal(true);

  constructor(private readonly api: FormateurApiService) {
    this.load();
  }

  selectCours(cours: CoursResponse) {
    this.selected.set(cours);
    forkJoin([
      this.api.getCoursStats(cours.code),
      this.api.getEtudiants(cours.code)
    ]).subscribe({
      next: ([stats, etudiants]) => {
        this.stats.set(stats);
        this.etudiants.set(etudiants);
        
        // Notifier les étudiants inscrits (max 5 nouveaux)
        this.notifyInscribedStudents(cours, etudiants);
      }
    });
  }

  private notifyInscribedStudents(cours: CoursResponse, etudiants: EtudiantResponse[]) {
    const notifiedKey = `notified_students_${cours.code}`;
    const notified = new Set(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));
    
    const newStudents = etudiants.filter(e => !notified.has(e.id)).slice(0, 5);
    
    newStudents.forEach(etudiant => {
      this.navNotification.addFormateurEtudiantInscrit(
        `${etudiant.prenom} ${etudiant.nom}`,
        etudiant.email,
        etudiant.matricule,
        cours.titre,
        cours.code,
        etudiant.groupeNom ?? undefined
      );
      notified.add(etudiant.id);
    });
    
    localStorage.setItem(notifiedKey, JSON.stringify([...notified]));
  }

  downloadReport(cours: CoursResponse) {
    this.api.downloadReport(cours.code).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notes-${cours.code}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
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
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }
}
