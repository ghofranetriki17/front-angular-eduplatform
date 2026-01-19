import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (notification of notifications(); track notification.id) {
        <div 
          class="toast" 
          [class]="'toast-' + notification.type"
          [@slideIn]
        >
          <div class="toast-icon">
            @switch (notification.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>⚠</span> }
              @case ('info') { <span>ℹ</span> }
            }
          </div>
          <div class="toast-content">
            <strong class="toast-title">{{ notification.title }}</strong>
            <p class="toast-message">{{ notification.message }}</p>
          </div>
          <button class="toast-close" (click)="dismiss(notification.id)" aria-label="Fermer">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: var(--glass-strong, rgba(255, 255, 255, 0.95));
      backdrop-filter: blur(20px);
      box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(0, 0, 0, 0.05);
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      background: linear-gradient(135deg, #22c55e, #10b981);
      color: white;
    }

    .toast-error .toast-icon {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .toast-warning .toast-icon {
      background: linear-gradient(135deg, #eab308, #f59e0b);
      color: white;
    }

    .toast-info .toast-icon {
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      color: white;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--ink, #0f172a);
      margin-bottom: 4px;
    }

    .toast-message {
      font-size: 13px;
      color: var(--muted, #64748b);
      margin: 0;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      color: var(--muted, #64748b);
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .toast-close:hover {
      background: var(--bg-secondary, #e2e8f0);
      color: var(--ink, #0f172a);
    }

    /* Bordure colorée à gauche */
    .toast-success {
      border-left: 4px solid #22c55e;
    }

    .toast-error {
      border-left: 4px solid #ef4444;
    }

    .toast-warning {
      border-left: 4px solid #eab308;
    }

    .toast-info {
      border-left: 4px solid #0ea5e9;
    }
  `]
})
export class ToastComponent {
  private readonly notificationService = inject(NotificationService);
  
  readonly notifications = this.notificationService.notifications;

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
