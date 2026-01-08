import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  CoursMoyenneResponse,
  CoursResponse,
  DashboardEtudiantResponse,
  InscriptionResponse,
  NoteResponse,
  SeanceResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class EtudiantApiService {
  private readonly baseUrl = `${environment.apiUrl}/api/etudiant`;

  constructor(private readonly http: HttpClient) {}

  getDashboard() {
    return this.http.get<DashboardEtudiantResponse>(`${this.baseUrl}/dashboard`);
  }

  getCours() {
    return this.http.get<CoursResponse[]>(`${this.baseUrl}/cours`);
  }

  getCoursDisponibles() {
    return this.http.get<CoursResponse[]>(`${this.baseUrl}/cours/disponibles`);
  }

  getInscriptions() {
    return this.http.get<InscriptionResponse[]>(`${this.baseUrl}/inscriptions`);
  }

  inscrire(coursCode: string, sessionId?: number) {
    return this.http.post<InscriptionResponse>(`${this.baseUrl}/inscriptions`, {
      coursCode,
      sessionId: sessionId ?? null
    });
  }

  annulerInscription(id: number) {
    return this.http.post<void>(`${this.baseUrl}/inscriptions/${id}/annuler`, {});
  }

  getNotes() {
    return this.http.get<NoteResponse[]>(`${this.baseUrl}/notes`);
  }

  getMoyennes() {
    return this.http.get<CoursMoyenneResponse[]>(`${this.baseUrl}/notes/moyennes`);
  }

  getSeances(debut?: string, fin?: string) {
    let params = new HttpParams();
    if (debut) {
      params = params.set('debut', debut);
    }
    if (fin) {
      params = params.set('fin', fin);
    }
    return this.http.get<SeanceResponse[]>(`${this.baseUrl}/seances`, { params });
  }
}
