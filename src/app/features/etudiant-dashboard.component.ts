import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { EtudiantApiService } from '../core/services/etudiant-api.service';
import { DashboardEtudiantResponse, NoteResponse, SeanceResponse } from '../core/models/api.models';

@Component({
  selector: 'app-etudiant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './etudiant-dashboard.component.html',
  styleUrl: './etudiant-dashboard.component.css'
})
export class EtudiantDashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(EtudiantApiService);

  readonly profile = this.auth.profile;
  readonly today = new Date();
  readonly vm$ = this.api.getDashboard().pipe(
    map(data => this.buildVm(data))
  );

  private buildVm(data: DashboardEtudiantResponse) {
    const seances = [...data.prochainesSeances].sort((a, b) =>
      EtudiantDashboardComponent.dateTimeValue(a) - EtudiantDashboardComponent.dateTimeValue(b)
    );
    const notes = [...data.dernieresNotes].sort((a, b) =>
      EtudiantDashboardComponent.dateValue(b) - EtudiantDashboardComponent.dateValue(a)
    );
    const nextSeance = seances[0] ?? null;
    const lastNote = notes[0] ?? null;
    const missingRoomCount = seances.filter(seance => !seance.salle).length;
    const seancesThisWeek = seances.filter(seance =>
      EtudiantDashboardComponent.isWithinDays(seance.dateSeance, 7)
    ).length;
    const moyenne = data.moyenneGenerale ?? null;
    const moyenneDisplay = moyenne == null ? '--' : moyenne.toFixed(2);
    const moyennePercent = moyenne == null ? 0 : EtudiantDashboardComponent.clamp((moyenne / 20) * 100);
    const nextSeanceLabel = nextSeance
      ? EtudiantDashboardComponent.relativeDayLabel(nextSeance.dateSeance)
      : 'Aucune';

    return {
      ...data,
      seances,
      notes,
      nextSeance,
      lastNote,
      missingRoomCount,
      seancesThisWeek,
      moyenneDisplay,
      moyennePercent,
      nextSeanceLabel
    };
  }

  private static dateValue(note: NoteResponse): number {
    if (!note.dateEvaluation) {
      return 0;
    }
    const dateOnly = note.dateEvaluation.split('T')[0];
    return new Date(dateOnly).getTime();
  }

  private static dateTimeValue(seance: SeanceResponse): number {
    const dateOnly = seance.dateSeance.split('T')[0];
    const time = seance.heureDebut || '00:00';
    return new Date(`${dateOnly}T${time}`).getTime();
  }

  private static isWithinDays(dateStr: string, days: number): boolean {
    const diff = EtudiantDashboardComponent.dayDiff(dateStr);
    return diff >= 0 && diff <= days;
  }

  private static relativeDayLabel(dateStr: string): string {
    const diff = EtudiantDashboardComponent.dayDiff(dateStr);
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
