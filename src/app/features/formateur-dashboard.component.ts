import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { FormateurApiService } from '../core/services/formateur-api.service';
import { AuthService } from '../core/auth.service';
import { CoursStatsResponse, DashboardFormateurResponse, SeanceResponse } from '../core/models/api.models';

@Component({
  selector: 'app-formateur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './formateur-dashboard.component.html',
  styleUrl: './formateur-dashboard.component.css'
})
export class FormateurDashboardComponent {
  private readonly api = inject(FormateurApiService);
  private readonly auth = inject(AuthService);

  readonly profile = this.auth.profile;
  readonly today = new Date();
  readonly vm$ = this.api.getDashboard().pipe(
    map(data => this.buildVm(data))
  );

  private buildVm(data: DashboardFormateurResponse) {
    const seances = [...data.prochainesSeances].sort((a, b) =>
      FormateurDashboardComponent.dateTimeValue(a) - FormateurDashboardComponent.dateTimeValue(b)
    );
    const nextSeance = seances[0] ?? null;
    const missingRoomCount = seances.filter(seance => !seance.salle).length;
    const seancesThisWeek = seances.filter(seance =>
      FormateurDashboardComponent.isWithinDays(seance.dateSeance, 7)
    ).length;
    const coursPopulaires = data.coursPopulaires ?? [];
    const stats = data.coursStats
      .map(stat => ({
        ...stat,
        tauxReussiteClamped: FormateurDashboardComponent.clamp(stat.tauxReussite)
      }))
      .sort((a, b) => b.tauxReussiteClamped - a.tauxReussiteClamped);
    const coursRisque = stats.filter(stat => stat.tauxReussiteClamped < 60).slice(0, 3);
    const totalInscrits = stats.reduce((sum, stat) => sum + (stat.inscritsActifs || 0), 0);
    const nextSeanceLabel = nextSeance
      ? FormateurDashboardComponent.relativeDayLabel(nextSeance.dateSeance)
      : 'Aucune';

    return {
      ...data,
      seances,
      nextSeance,
      missingRoomCount,
      seancesThisWeek,
      stats,
      coursRisque,
      totalInscrits,
      nextSeanceLabel,
      coursPopulaires
    };
  }

  private static dateTimeValue(seance: SeanceResponse): number {
    const dateOnly = seance.dateSeance.split('T')[0];
    const time = seance.heureDebut || '00:00';
    return new Date(`${dateOnly}T${time}`).getTime();
  }

  private static isWithinDays(dateStr: string, days: number): boolean {
    const diff = FormateurDashboardComponent.dayDiff(dateStr);
    return diff >= 0 && diff <= days;
  }

  private static relativeDayLabel(dateStr: string): string {
    const diff = FormateurDashboardComponent.dayDiff(dateStr);
    if (diff === 0) {
      return "Aujourd'hui";
    }
    if (diff === 1) {
      return 'Demain';
    }
    if (diff > 1) {
      return `Dans ${diff} jours`;
    }
    return 'Passe';
  }

  private static dayDiff(dateStr: string): number {
    const dateOnly = dateStr.split('T')[0];
    const parts = dateOnly.split('-').map(Number);
    const target = parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  private static clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
