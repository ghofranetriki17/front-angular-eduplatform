import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { EtudiantApiService } from '../../core/services/etudiant-api.service';
import { CoursResponse, InscriptionResponse, SeanceResponse } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { NavbarNotificationService } from '../../core/services/navbar-notification.service';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.css'
})
export class SessionsComponent {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly navNotification = inject(NavbarNotificationService);
  
  readonly seances = signal<SeanceResponse[]>([]);
  readonly inscriptions = signal<InscriptionResponse[]>([]);
  readonly coursByCode = signal<Record<string, CoursResponse>>({});
  readonly loading = signal(true);
  readonly error = signal('');

  private readonly today = new Date();
  private readonly start = this.toIsoDate(this.today);
  private readonly end = this.toIsoDate(new Date(this.today.getTime() + 21 * 24 * 60 * 60 * 1000));

  constructor(private readonly api: EtudiantApiService) {
    this.load();
  }

  annuler(id: number) {
    const inscription = this.inscriptions().find(i => i.id === id);
    const coursTitle = inscription?.coursTitre || 'le cours';
    const coursCode = inscription?.coursCode || '';
    this.api.annulerInscription(id).subscribe({
      next: () => {
        this.notification.notifyInscriptionCancelled(coursTitle);
        this.navNotification.addDesinscriptionNotification(coursTitle, coursCode);
        this.notifyFormateurDesinscription(coursCode, coursTitle);
        this.load();
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de supprimer cette inscription');
        this.error.set('Impossible de supprimer cette inscription');
      }
    });
  }

  private notifyFormateurDesinscription(coursCode: string, coursTitle: string) {
    const cours = this.coursByCode()[coursCode];
    if (!cours || !cours.formateurId) {
      return;
    }
    const profile = this.auth.profile();
    if (!profile) {
      return;
    }
    const fullName = `${profile.prenom} ${profile.nom}`.trim();
    this.pushFormateurNotification(cours.formateurId, {
      type: 'desinscription',
      title: 'Desinscription',
      message: `${fullName} s'est desinscrit du cours "${coursTitle || cours.titre}"`,
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
    this.coursByCode.set({});
    forkJoin([
      this.api.getSeances(this.start, this.end),
      this.api.getInscriptions(),
      this.api.getCours()
    ]).subscribe({
      next: ([seances, inscriptions, cours]) => {
        this.seances.set(seances);
        this.inscriptions.set(inscriptions);
        const map: Record<string, CoursResponse> = {};
        cours.forEach(item => {
          map[item.code] = item;
        });
        this.coursByCode.set(map);
        
        // Ajouter des notifications pour les prochaines séances (max 3)
        this.notifyUpcomingSeances(seances);
      },
      error: () => {
        this.error.set('Erreur lors du chargement');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  private notifyUpcomingSeances(seances: SeanceResponse[]) {
    // Filtrer les séances des 7 prochains jours et non déjà notifiées
    const profile = this.auth.profile();
    const scope = profile ? `${profile.role.toLowerCase()}_${profile.id}` : 'guest';
    const notifiedKey = `notified_seances_${scope}`;
    const notified = new Set(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));
    
    const upcoming = seances
      .filter(s => !notified.has(s.id))
      .slice(0, 3);
    
    upcoming.forEach(seance => {
      const dateFormatted = new Date(seance.dateSeance).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      
      this.navNotification.addSeanceNotification(
        seance.coursTitre,
        seance.coursCode,
        dateFormatted,
        seance.heureDebut,
        seance.salle ?? undefined
      );
      
      notified.add(seance.id);
    });
    
    localStorage.setItem(notifiedKey, JSON.stringify([...notified]));
  }

  private toIsoDate(date: Date) {
    return date.toISOString().split('T')[0];
  }
}
