export interface CoursResponse {
  code: string;
  titre: string;
  description?: string | null;
  volumeHoraire?: number | null;
  coefficient?: number | null;
  actif?: boolean | null;
  specialite?: string | null;
  formateurId?: number | null;
  formateurNom?: string | null;
  inscritsActifs: number;
}

export interface InscriptionResponse {
  id: number;
  statut: string;
  dateInscription: string;
  dateAnnulation?: string | null;
  sessionId?: number | null;
  sessionNom?: string | null;
  coursCode: string;
  coursTitre: string;
}

export interface NoteResponse {
  id: number;
  valeur: number;
  dateEvaluation?: string | null;
  typeEvaluation: string;
  coefficient?: number | null;
  commentaire?: string | null;
  coursCode: string;
  coursTitre: string;
}

export interface SeanceResponse {
  id: number;
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
  salle?: string | null;
  typeSeance: string;
  statut: string;
  coursCode: string;
  coursTitre: string;
  formateurId?: number | null;
  formateurNom?: string | null;
}

export interface PopularCoursResponse {
  code: string;
  titre: string;
  inscritsActifs: number;
}

export interface DashboardEtudiantResponse {
  inscriptionsActives: number;
  coursActifs: number;
  moyenneGenerale?: number | null;
  prochainesSeances: SeanceResponse[];
  dernieresNotes: NoteResponse[];
  coursPopulaires: PopularCoursResponse[];
}

export interface CoursStatsResponse {
  coursCode: string;
  coursTitre: string;
  moyenne?: number | null;
  tauxReussite: number;
  inscritsActifs: number;
}

export interface DashboardFormateurResponse {
  coursAssures: number;
  seancesPlanifiees: number;
  notesSaisies: number;
  prochainesSeances: SeanceResponse[];
  coursStats: CoursStatsResponse[];
  coursPopulaires: PopularCoursResponse[];
}

export interface CoursMoyenneResponse {
  coursCode: string;
  coursTitre: string;
  moyenne: number;
}

export interface EtudiantResponse {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  groupeNom?: string | null;
}

export type SeanceStatut = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'REPORTEE';
