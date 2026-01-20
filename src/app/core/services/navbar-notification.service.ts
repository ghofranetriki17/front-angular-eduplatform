import { Injectable, signal, computed, effect } from '@angular/core';
import { AuthService } from '../auth.service';

export interface NavNotification {
  id: number;
  type: 'inscription' | 'desinscription' | 'note' | 'seance' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  coursCode?: string;
  etudiantNom?: string;
  details?: string;  // Détails supplémentaires (date, heure, salle, etc.)
}

@Injectable({ providedIn: 'root' })
export class NavbarNotificationService {
  private readonly _notifications = signal<NavNotification[]>([]);
  private nextId = 1;
  private activeKey: string | null = null;

  readonly notifications = computed(() => this._notifications());
  readonly unreadCount = computed(() => this._notifications().filter(n => !n.read).length);
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor(private readonly auth: AuthService) {
    // Charger les notifications depuis localStorage au démarrage
    effect(() => {
      const key = this.buildStorageKey();
      if (key === this.activeKey) {
        return;
      }
      this.activeKey = key;
      this.loadFromStorage();
    });
  }

  /**
   * Ajoute une notification d'inscription (pour étudiant)
   */
  addInscriptionNotification(coursNom: string, coursCode: string): void {
    this.add({
      type: 'inscription',
      title: 'Inscription confirmée',
      message: `Vous êtes inscrit au cours "${coursNom}"`,
      details: `Code: ${coursCode}`,
      coursCode
    });
  }

  /**
   * Ajoute une notification d'annulation (pour étudiant)
   */
  addDesinscriptionNotification(coursNom: string, coursCode: string): void {
    this.add({
      type: 'desinscription',
      title: 'Inscription annulée',
      message: `Votre inscription au cours "${coursNom}" a été annulée`,
      details: `Code: ${coursCode}`,
      coursCode
    });
  }

  /**
   * Ajoute une notification de séance planifiée (pour étudiant)
   */
  addSeanceNotification(coursNom: string, coursCode: string, date: string, heure: string, salle?: string): void {
    const salleInfo = salle ? ` | Salle: ${salle}` : '';
    this.add({
      type: 'seance',
      title: 'Séance planifiée',
      message: `${coursNom}`,
      details: `📅 ${date} à ${heure}${salleInfo}`,
      coursCode
    });
  }

  /**
   * Ajoute une notification de nouvelle inscription (pour formateur)
   */
  addFormateurNewInscription(etudiantNom: string, etudiantEmail: string, coursNom: string, coursCode: string, groupeNom?: string): void {
    const groupeInfo = groupeNom ? ` | Groupe: ${groupeNom}` : '';
    this.add({
      type: 'inscription',
      title: 'Nouvelle inscription',
      message: `${etudiantNom} s'est inscrit à "${coursNom}"`,
      details: `📧 ${etudiantEmail}${groupeInfo}`,
      coursCode,
      etudiantNom
    });
  }

  /**
   * Ajoute une notification de désinscription (pour formateur)
   */
  addFormateurDesinscription(etudiantNom: string, etudiantEmail: string, coursNom: string, coursCode: string): void {
    this.add({
      type: 'desinscription',
      title: 'Désinscription',
      message: `${etudiantNom} s'est désinscrit de "${coursNom}"`,
      details: `📧 ${etudiantEmail}`,
      coursCode,
      etudiantNom
    });
  }

  /**
   * Ajoute une notification d'étudiant inscrit (résumé pour formateur)
   */
  addFormateurEtudiantInscrit(etudiantNom: string, etudiantEmail: string, matricule: string, coursNom: string, coursCode: string, groupeNom?: string): void {
    const groupeInfo = groupeNom ? ` | Groupe: ${groupeNom}` : '';
    this.add({
      type: 'info',
      title: `Étudiant inscrit - ${coursNom}`,
      message: `${etudiantNom} (${matricule})`,
      details: `📧 ${etudiantEmail}${groupeInfo}`,
      coursCode,
      etudiantNom
    });
  }

  /**
   * Ajoute une notification générale
   */
  addInfo(title: string, message: string, details?: string): void {
    this.add({ type: 'info', title, message, details });
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(id: number): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.saveToStorage();
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    this._notifications.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
    this.saveToStorage();
  }

  /**
   * Supprime une notification
   */
  remove(id: number): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
    this.saveToStorage();
  }

  /**
   * Efface toutes les notifications
   */
  clearAll(): void {
    this._notifications.set([]);
    this.saveToStorage();
  }

  private add(notification: Omit<NavNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: NavNotification = {
      ...notification,
      id: this.nextId++,
      timestamp: new Date(),
      read: false
    };

    this._notifications.update(list => [newNotification, ...list].slice(0, 50)); // Garder max 50 notifications
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      if (!this.activeKey) {
        return;
      }
      localStorage.setItem(this.activeKey, JSON.stringify(this._notifications()));
    } catch {
      // Ignorer les erreurs de stockage
    }
  }

  private loadFromStorage(): void {
    try {
      this._notifications.set([]);
      this.nextId = 1;
      if (!this.activeKey) {
        return;
      }
      const stored = localStorage.getItem(this.activeKey);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as NavNotification[];
      // Convertir les dates string en Date objects
      const notifications = parsed.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
      this._notifications.set(notifications);
      this.nextId = Math.max(...notifications.map(n => n.id), 0) + 1;
    } catch {
      // Ignorer les erreurs de lecture
    }
  }

  private buildStorageKey(): string | null {
    const profile = this.auth.profile();
    if (!profile) {
      return null;
    }
    return `nav_notifications_${profile.role.toLowerCase()}_${profile.id}`;
  }
}
