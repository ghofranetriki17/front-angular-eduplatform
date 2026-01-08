import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { catchError, map, of, tap, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'ADMIN' | 'FORMATEUR' | 'ETUDIANT';

export interface UserProfile {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'frontformation.auth.basic';
  private readonly profileSignal = signal<UserProfile | null>(null);

  readonly profile = computed(() => this.profileSignal());
  readonly isLoggedIn = computed(() => !!this.profileSignal());

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<UserProfile> {
    const token = btoa(`${email}:${password}`);
    localStorage.setItem(this.storageKey, token);
    return this.fetchProfile().pipe(
      tap(profile => this.profileSignal.set(profile)),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.profileSignal.set(null);
  }

  ensureProfile(): Observable<UserProfile | null> {
    const token = this.getToken();
    if (!token) {
      this.profileSignal.set(null);
      return of(null);
    }
    if (this.profileSignal()) {
      return of(this.profileSignal());
    }
    return this.fetchProfile().pipe(
      tap(profile => this.profileSignal.set(profile)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  private fetchProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/api/me`).pipe(
      map(profile => ({
        ...profile,
        role: profile.role.toUpperCase() as UserRole
      }))
    );
  }

  updateProfile(payload: {
    email?: string | null;
    nom?: string | null;
    prenom?: string | null;
    telephone?: string | null;
    password?: string | null;
  }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${environment.apiUrl}/api/me`, payload).pipe(
      map(profile => ({
        ...profile,
        role: profile.role.toUpperCase() as UserRole
      })),
      tap(profile => {
        this.profileSignal.set(profile);
        this.refreshToken(payload.email ?? profile.email, payload.password ?? null);
      })
    );
  }

  private refreshToken(email: string, password: string | null) {
    const token = this.getToken();
    if (!token) {
      return;
    }
    const [currentEmail, currentPassword] = atob(token).split(':');
    const nextEmail = email || currentEmail;
    const nextPassword = password || currentPassword;
    localStorage.setItem(this.storageKey, btoa(`${nextEmail}:${nextPassword}`));
  }
}
