import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EtudiantApiService } from '../../core/services/etudiant-api.service';
import { InscriptionResponse, SeanceResponse } from '../../core/models/api.models';
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
  private readonly notification = inject(NotificationService);
  private readonly navNotification = inject(NavbarNotificationService);
  
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
    const inscription = this.inscriptions().find(i => i.id === id);
    const coursTitle = inscription?.coursTitre || 'le cours';
    const coursCode = inscription?.coursCode || '';
    this.api.annulerInscription(id).subscribe({
      next: () => {
        this.notification.notifyInscriptionCancelled(coursTitle);
        this.navNotification.addDesinscriptionNotification(coursTitle, coursCode);
        this.load();
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de supprimer cette inscription');
        this.error.set('Impossible de supprimer cette inscription');
      }
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
    const notifiedKey = 'notified_seances';
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
