import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  CoursResponse,
  CoursStatsResponse,
  DashboardFormateurResponse,
  EtudiantResponse,
  NoteResponse,
  SeanceResponse,
  SeanceStatut
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class FormateurApiService {
  private readonly baseUrl = `${environment.apiUrl}/api/formateur`;

  constructor(private readonly http: HttpClient) {}

  getDashboard() {
    return this.http.get<DashboardFormateurResponse>(`${this.baseUrl}/dashboard`);
  }

  getCours() {
    return this.http.get<CoursResponse[]>(`${this.baseUrl}/cours`);
  }

  getCoursStats(code: string) {
    return this.http.get<CoursStatsResponse>(`${this.baseUrl}/cours/${code}/stats`);
  }

  getEtudiants(code: string) {
    return this.http.get<EtudiantResponse[]>(`${this.baseUrl}/cours/${code}/etudiants`);
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

  updateSeanceStatut(id: number, statut: SeanceStatut) {
    const params = new HttpParams().set('statut', statut);
    return this.http.post<void>(`${this.baseUrl}/seances/${id}/statut`, {}, { params });
  }

  getNotes() {
    return this.http.get<NoteResponse[]>(`${this.baseUrl}/notes`);
  }

  createNote(payload: {
    etudiantId: number;
    coursCode: string;
    valeur: number;
    typeEvaluation?: string | null;
    commentaire?: string | null;
    coefficient?: number | null;
  }) {
    return this.http.post<NoteResponse>(`${this.baseUrl}/notes`, payload);
  }

  downloadReport(coursCode: string) {
    const params = new HttpParams().set('coursCode', coursCode);
    return this.http.get(`${this.baseUrl}/notes/report`, {
      params,
      responseType: 'blob'
    });
  }
}
