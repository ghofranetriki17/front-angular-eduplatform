import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);
  private nextId = 1;

  readonly notifications = computed(() => this._notifications());

  /**
   * Affiche une notification de succès
   */
  success(title: string, message: string, duration = 5000): void {
    this.add({ type: 'success', title, message, duration });
  }

  /**
   * Affiche une notification d'erreur
   */
  error(title: string, message: string, duration = 7000): void {
    this.add({ type: 'error', title, message, duration });
  }

  /**
   * Affiche une notification d'avertissement
   */
  warning(title: string, message: string, duration = 6000): void {
    this.add({ type: 'warning', title, message, duration });
  }

  /**
   * Affiche une notification d'information
   */
  info(title: string, message: string, duration = 5000): void {
    this.add({ type: 'info', title, message, duration });
  }

  /**
   * Notifications spécifiques aux inscriptions
   */
  notifyInscriptionCreated(coursNom: string): void {
    this.success(
      'Inscription réussie',
      `Vous êtes maintenant inscrit au cours "${coursNom}". Un email de confirmation a été envoyé.`
    );
  }

  notifyInscriptionCancelled(coursNom: string): void {
    this.info(
      'Inscription annulée',
      `Votre inscription au cours "${coursNom}" a été annulée.`
    );
  }

  notifyFormateurNewInscription(etudiantNom: string, coursNom: string): void {
    this.info(
      'Nouvelle inscription',
      `L'étudiant ${etudiantNom} s'est inscrit au cours "${coursNom}".`
    );
  }

  notifyFormateurInscriptionCancelled(etudiantNom: string, coursNom: string): void {
    this.warning(
      'Désinscription',
      `L'étudiant ${etudiantNom} s'est désinscrit du cours "${coursNom}".`
    );
  }

  /**
   * Ferme une notification
   */
  dismiss(id: number): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  /**
   * Ferme toutes les notifications
   */
  clear(): void {
    this._notifications.set([]);
  }

  private add(notification: Omit<Notification, 'id'>): void {
    const id = this.nextId++;
    const newNotification: Notification = { ...notification, id };

    this._notifications.update(list => [...list, newNotification]);

    // Auto-dismiss après la durée spécifiée
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.dismiss(id), notification.duration);
    }
  }
}
