import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
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
  private readonly auth = inject(AuthService);
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
    const profile = this.auth.profile();
    const scope = profile ? `${profile.role.toLowerCase()}_${profile.id}` : 'guest';
    const notifiedKey = `notified_students_${scope}_${cours.code}`;
    const knownKey = `known_students_${scope}_${cours.code}`;
    const notified = new Set<number>(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));
    const known = JSON.parse(localStorage.getItem(knownKey) || '[]') as Array<{
      id: number;
      nom: string;
      prenom: string;
      email: string;
    }>;
    const currentIds = new Set(etudiants.map(etudiant => etudiant.id));
    const removedStudents = known.filter(student => !currentIds.has(student.id)).slice(0, 5);
    
    removedStudents.forEach(student => {
      this.navNotification.addFormateurDesinscription(
        `${student.prenom} ${student.nom}`,
        student.email,
        cours.titre,
        cours.code
      );
      notified.delete(student.id);
    });

    const newStudents = etudiants.filter(etudiant => !notified.has(etudiant.id)).slice(0, 5);
    
    newStudents.forEach(etudiant => {
      this.navNotification.addFormateurNewInscription(
        `${etudiant.prenom} ${etudiant.nom}`,
        etudiant.email,
        cours.titre,
        cours.code,
        etudiant.groupeNom ?? undefined
      );
      notified.add(etudiant.id);
    });
    
    localStorage.setItem(notifiedKey, JSON.stringify([...notified]));
    const snapshot = etudiants.map(etudiant => ({
      id: etudiant.id,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email
    }));
    localStorage.setItem(knownKey, JSON.stringify(snapshot));
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
