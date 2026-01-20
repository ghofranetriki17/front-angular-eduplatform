import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { EtudiantApiService } from '../../core/services/etudiant-api.service';
import { CoursResponse } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { NavbarNotificationService } from '../../core/services/navbar-notification.service';

@Component({
  selector: 'app-cours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cours.component.html',
  styleUrl: './cours.component.css'
})
export class CoursComponent {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly navNotification = inject(NavbarNotificationService);
  
  readonly cours = signal<CoursResponse[]>([]);
  readonly disponibles = signal<CoursResponse[]>([]);
  readonly inscriptionIdByCode = signal<Record<string, number>>({});
  readonly loading = signal(true);
  readonly error = signal('');

  constructor(private readonly api: EtudiantApiService) {
    this.load();
  }

  inscrire(cours: CoursResponse) {
    this.api.inscrire(cours.code).subscribe({
      next: () => {
        this.notification.notifyInscriptionCreated(cours.titre);
        this.navNotification.addInscriptionNotification(cours.titre, cours.code);
        this.notifyFormateurInscription(cours);
        this.load();
      },
      error: () => {
        this.notification.error('Erreur', "Impossible de s'inscrire à ce cours");
        this.error.set("Impossible d'inscrire ce cours");
      }
    });
  }

  canDesinscrire(cours: CoursResponse): boolean {
    return !!this.inscriptionIdByCode()[cours.code];
  }

  desinscrire(cours: CoursResponse) {
    const inscriptionId = this.inscriptionIdByCode()[cours.code];
    if (!inscriptionId) {
      this.notification.error('Erreur', "Impossible de trouver l'inscription");
      return;
    }
    this.api.annulerInscription(inscriptionId).subscribe({
      next: () => {
        this.notification.notifyInscriptionCancelled(cours.titre);
        this.navNotification.addDesinscriptionNotification(cours.titre, cours.code);
        this.notifyFormateurDesinscription(cours);
        this.load();
      },
      error: () => {
        this.notification.error('Erreur', "Impossible d'annuler l'inscription");
        this.error.set("Impossible d'annuler l'inscription");
      }
    });
  }

  private notifyFormateurInscription(cours: CoursResponse) {
    const profile = this.auth.profile();
    if (!profile || !cours.formateurId) {
      return;
    }
    const fullName = `${profile.prenom} ${profile.nom}`.trim();
    this.pushFormateurNotification(cours.formateurId, {
      type: 'inscription',
      title: 'Nouvelle inscription',
      message: `${fullName} s'est inscrit au cours "${cours.titre}"`,
      details: `Email: ${profile.email}`,
      coursCode: cours.code,
      etudiantNom: fullName
    });
    this.syncFormateurStudentCache(cours.formateurId, cours.code, profile, 'add');
  }

  private notifyFormateurDesinscription(cours: CoursResponse) {
    const profile = this.auth.profile();
    if (!profile || !cours.formateurId) {
      return;
    }
    const fullName = `${profile.prenom} ${profile.nom}`.trim();
    this.pushFormateurNotification(cours.formateurId, {
      type: 'desinscription',
      title: 'Desinscription',
      message: `${fullName} s'est desinscrit du cours "${cours.titre}"`,
      details: `Email: ${profile.email}`,
      coursCode: cours.code,
      etudiantNom: fullName
    });
    this.syncFormateurStudentCache(cours.formateurId, cours.code, profile, 'remove');
  }

  private pushFormateurNotification(
    formateurId: number,
    notification: {
      type: 'inscription' | 'desinscription';
      title: string;
      message: string;
      details?: string;
      coursCode?: string;
      etudiantNom?: string;
    }
  ) {
    const key = `nav_notifications_formateur_${formateurId}`;
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as Array<{ id: number }>;
      const nextId = existing.length ? Math.max(...existing.map(item => item.id)) + 1 : 1;
      const newNotification = {
        ...notification,
        id: nextId,
        timestamp: new Date(),
        read: false
      };
      const updated = [newNotification, ...existing].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      return;
    }
  }

  private syncFormateurStudentCache(
    formateurId: number,
    coursCode: string,
    student: { id: number; nom: string; prenom: string; email: string },
    action: 'add' | 'remove'
  ) {
    const scope = `formateur_${formateurId}`;
    const knownKey = `known_students_${scope}_${coursCode}`;
    const notifiedKey = `notified_students_${scope}_${coursCode}`;
    try {
      const known = JSON.parse(localStorage.getItem(knownKey) || '[]') as Array<{
        id: number;
        nom: string;
        prenom: string;
        email: string;
      }>;
      const notified = new Set<number>(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));
      let nextKnown = known;
      if (action === 'add') {
        if (!known.some(entry => entry.id === student.id)) {
          nextKnown = [
            ...known,
            {
              id: student.id,
              nom: student.nom,
              prenom: student.prenom,
              email: student.email
            }
          ];
        }
        notified.add(student.id);
      } else {
        nextKnown = known.filter(entry => entry.id !== student.id);
        notified.delete(student.id);
      }
      localStorage.setItem(knownKey, JSON.stringify(nextKnown));
      localStorage.setItem(notifiedKey, JSON.stringify([...notified]));
    } catch {
      return;
    }
  }

  private load() {
    this.loading.set(true);
    this.error.set('');
    this.inscriptionIdByCode.set({});
    forkJoin([this.api.getCours(), this.api.getCoursDisponibles(), this.api.getInscriptions()]).subscribe({
      next: ([cours, disponibles, inscriptions]) => {
        this.cours.set(cours);
        this.disponibles.set(disponibles);
        const active = inscriptions.filter(inscription => inscription.statut === 'ACTIVE');
        const map: Record<string, number> = {};
        active.forEach(inscription => {
          map[inscription.coursCode] = inscription.id;
        });
        this.inscriptionIdByCode.set(map);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des cours');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
