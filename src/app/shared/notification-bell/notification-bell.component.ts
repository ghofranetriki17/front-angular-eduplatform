import { Component, inject, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarNotificationService, NavNotification } from '../../core/services/navbar-notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      #bellBtn
      class="bell-btn" 
      (click)="toggle($event)"
      [class.has-unread]="service.hasUnread()"
    >
      🔔
      <span class="count" *ngIf="service.hasUnread()">{{ service.unreadCount() }}</span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    .bell-btn {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      border: 2px solid #e2e8f0;
      background: white;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .bell-btn:hover {
      border-color: #f97316;
      transform: scale(1.05);
    }
    
    .bell-btn.has-unread {
      animation: bellPulse 2s infinite;
    }
    
    @keyframes bellPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
      50% { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
    }
    
    .count {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      font-size: 12px;
      font-weight: 700;
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
    }
  `]
})
export class NotificationBellComponent {
  @ViewChild('bellBtn') bellBtn!: ElementRef<HTMLButtonElement>;
  
  readonly service = inject(NavbarNotificationService);
  readonly isOpen = signal(false);
  readonly selectedNotif = signal<NavNotification | null>(null);
  
  private overlay: HTMLDivElement | null = null;
  private backdrop: HTMLDivElement | null = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.overlay && !this.overlay.contains(event.target as Node) && 
        !this.bellBtn?.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  toggle(event: Event) {
    event.stopPropagation();
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  private open() {
    this.isOpen.set(true);
    this.createOverlay();
  }

  close() {
    this.isOpen.set(false);
    this.selectedNotif.set(null);
    this.removeOverlay();
  }

  private createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.innerHTML = this.getDropdownHTML();
    document.body.appendChild(this.overlay);
    this.appendOverlayStyles();
    this.applyOverlayLayout();
    this.attachEventListeners();
  }

  private removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.removeBackdrop();
  }

  private applyOverlayLayout() {
    if (!this.overlay) return;

    const isDetail = !!this.selectedNotif();
    if (isDetail) {
      this.ensureBackdrop();
      this.overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: min(560px, calc(100vw - 32px));
        max-height: min(720px, calc(100vh - 80px));
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 24px;
        box-shadow: 0 45px 90px rgba(15,23,42,0.35), 0 0 0 1px rgba(15,23,42,0.08);
        z-index: 999999;
        overflow: auto;
        animation: detailPop 0.2s ease;
      `;
      return;
    }

    this.removeBackdrop();
    const rect = this.bellBtn.nativeElement.getBoundingClientRect();
    this.overlay.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 12}px;
      right: ${window.innerWidth - rect.right}px;
      width: 400px;
      max-height: 550px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
      z-index: 999999;
      overflow: hidden;
      animation: dropdownSlide 0.25s ease;
    `;
  }

  private appendOverlayStyles() {
    if (!this.overlay) return;
    this.overlay.querySelector('style[data-notif-style]')?.remove();
    const style = document.createElement('style');
    style.setAttribute('data-notif-style', 'true');
    style.textContent = `
      @keyframes dropdownSlide {
        from { opacity: 0; transform: translateY(-15px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes detailPop {
        from { opacity: 0; transform: translate(-50%, -48%) scale(0.98); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    this.overlay.appendChild(style);
  }

  private ensureBackdrop() {
    if (this.backdrop) return;
    this.backdrop = document.createElement('div');
    this.backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      z-index: 999998;
    `;
    document.body.appendChild(this.backdrop);
  }

  private removeBackdrop() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
  }

  private attachEventListeners() {
    if (!this.overlay) return;

    // Mark all as read
    this.overlay.querySelector('.mark-read-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.service.markAllAsRead();
      this.updateOverlay();
    });

    // Clear all
    this.overlay.querySelector('.clear-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.service.clearAll();
      this.updateOverlay();
    });

    // Notification items
    this.overlay.querySelectorAll('.notif-item').forEach((item, index) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const notif = this.service.notifications()[index];
        if (notif) {
          this.service.markAsRead(notif.id);
          this.selectedNotif.set(notif);
          this.updateOverlay();
        }
      });
    });

    // Back button
    this.overlay.querySelector('.back-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedNotif.set(null);
      this.updateOverlay();
    });

    // Delete button
    this.overlay.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const notif = this.selectedNotif();
      if (notif) {
        this.service.remove(notif.id);
        this.selectedNotif.set(null);
        this.updateOverlay();
      }
    });
  }

  private updateOverlay() {
    if (!this.overlay) return;
    this.overlay.innerHTML = this.getDropdownHTML();
    this.appendOverlayStyles();
    this.applyOverlayLayout();
    this.attachEventListeners();
  }

  private getDropdownHTML(): string {
    const notifs = this.service.notifications();
    const selected = this.selectedNotif();

    if (selected) {
      return this.getDetailHTML(selected);
    }

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:linear-gradient(135deg,#fff7ed,#ffedd5);border-bottom:1px solid #fed7aa;">
        <span style="font-size:17px;font-weight:700;color:#1e293b;">🔔 Notifications</span>
        <div style="display:flex;gap:10px;">
          ${this.service.hasUnread() ? `<button class="mark-read-btn" style="background:none;border:none;font-size:13px;font-weight:600;color:#f97316;cursor:pointer;padding:6px 12px;border-radius:8px;">Tout lire</button>` : ''}
          ${notifs.length ? `<button class="clear-btn" style="background:none;border:none;font-size:13px;font-weight:600;color:#ef4444;cursor:pointer;padding:6px 12px;border-radius:8px;">Effacer</button>` : ''}
        </div>
      </div>
      <div style="max-height:450px;overflow-y:auto;background:white;">
        ${notifs.length ? notifs.map((n, i) => `
          <div class="notif-item" style="display:flex;align-items:flex-start;gap:14px;padding:16px 22px;cursor:pointer;border-bottom:1px solid #f1f5f9;background:${n.read ? 'white' : '#fff7ed'};border-left:4px solid ${n.read ? 'transparent' : '#f97316'};">
            <span style="font-size:28px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:${n.read ? '#f1f5f9' : '#ffedd5'};border-radius:14px;">
              ${this.getEmoji(n.type)}
            </span>
            <div style="flex:1;min-width:0;">
              <strong style="display:block;font-size:14px;font-weight:600;color:#1e293b;margin-bottom:4px;">${n.title}</strong>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n.message}</p>
              <small style="font-size:12px;color:#94a3b8;margin-top:6px;display:block;">${this.formatTime(n.timestamp)}</small>
            </div>
            <span style="font-size:20px;color:#cbd5e1;align-self:center;">→</span>
          </div>
        `).join('') : `
          <div style="padding:60px 20px;text-align:center;">
            <span style="font-size:56px;display:block;margin-bottom:16px;opacity:0.4;">🔕</span>
            <p style="margin:0;color:#94a3b8;font-size:15px;">Aucune notification</p>
          </div>
        `}
      </div>
    `;
  }

  private getDetailHTML(n: NavNotification): string {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:linear-gradient(135deg,#fff7ed,#ffedd5);border-bottom:1px solid #fed7aa;">
        <button class="back-btn" style="background:none;border:none;font-size:14px;font-weight:600;color:#475569;cursor:pointer;padding:6px 12px;border-radius:8px;">← Retour</button>
        <button class="delete-btn" style="background:none;border:none;font-size:13px;font-weight:600;color:#ef4444;cursor:pointer;padding:6px 12px;border-radius:8px;">Supprimer</button>
      </div>
      <div style="padding:30px 24px;text-align:center;background:white;">
        <span style="font-size:52px;display:block;margin-bottom:16px;">${this.getEmoji(n.type)}</span>
        <h3 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#1e293b;">${n.title}</h3>
        <span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;${this.getBadgeStyle(n.type)}">${this.getTypeName(n.type)}</span>
      </div>
      <div style="padding:20px 24px 30px;background:white;">
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px;">Message</label>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
            <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.7;">${n.message}</p>
          </div>
        </div>
        ${n.details ? `
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px;">Détails</label>
            <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1px solid #fed7aa;border-radius:12px;padding:14px 18px;font-size:14px;color:#1e293b;line-height:1.5;">${n.details}</div>
          </div>
        ` : ''}
        ${n.coursCode ? `
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px;">Code cours</label>
            <code style="display:inline-block;background:#f1f5f9;padding:10px 18px;border-radius:10px;font-family:Monaco,Consolas,monospace;font-size:14px;font-weight:600;color:#1e293b;border:1px solid #e2e8f0;">${n.coursCode}</code>
          </div>
        ` : ''}
        ${n.etudiantNom ? `
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px;">Étudiant</label>
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">${n.etudiantNom}</p>
          </div>
        ` : ''}
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
          <span style="font-size:13px;color:#64748b;">🕐 ${this.formatFullTime(n.timestamp)}</span>
        </div>
      </div>
    `;
  }

  private getEmoji(type: string): string {
    const map: Record<string, string> = {
      inscription: '✅',
      desinscription: '❌',
      note: '📝',
      seance: '📅',
      info: '👤'
    };
    return map[type] || '📌';
  }

  private getBadgeStyle(type: string): string {
    const styles: Record<string, string> = {
      inscription: 'background:#dcfce7;color:#16a34a;',
      desinscription: 'background:#fee2e2;color:#dc2626;',
      seance: 'background:#ffedd5;color:#ea580c;',
      note: 'background:#ede9fe;color:#7c3aed;',
      info: 'background:#e0f2fe;color:#0284c7;'
    };
    return styles[type] || 'background:#f1f5f9;color:#475569;';
  }

  getTypeName(type: string): string {
    const map: Record<string, string> = {
      inscription: 'Inscription',
      desinscription: 'Désinscription',
      note: 'Note',
      seance: 'Séance',
      info: 'Information'
    };
    return map[type] || type;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);

    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    if (hr < 24) return `Il y a ${hr}h`;
    if (day < 7) return `Il y a ${day}j`;
    return date.toLocaleDateString('fr-FR');
  }

  formatFullTime(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy() {
    this.removeOverlay();
  }
}
