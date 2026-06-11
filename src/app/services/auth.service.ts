import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthSession,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterCitizenRequest,
  RegisterCleaningOperationsStaffRequest,
  RegisterMunicipalReceptionistRequest,
  ResetPasswordRequest,
  UserRole,
} from '../models/auth.models';

const SESSION_KEYS = ['token', 'userId', 'profileId', 'role', 'fullName', 'email'] as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly sessionState = signal<AuthSession | null>(this.readSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.token));
  readonly role = computed(() => this.sessionState()?.role ?? null);

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap((session) => this.saveSession(session)),
    );
  }

  registerCitizen(request: RegisterCitizenRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/auth/register/citizen`, request);
  }

  registerReceptionist(request: RegisterMunicipalReceptionistRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/auth/register/receptionist`, request);
  }

  registerCleaningStaff(request: RegisterCleaningOperationsStaffRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/auth/register/cleaning-staff`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/auth/password/forgot`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/auth/password/reset`, request);
  }

  logout(): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/session/logout`, {}).pipe(
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('isLoggedIn');
    this.sessionState.set(null);
  }

  getToken(): string | null {
    return this.sessionState()?.token ?? localStorage.getItem('token');
  }

  getRole(): UserRole | null {
    return this.sessionState()?.role ?? null;
  }

  getProfileId(): number | null {
    return this.sessionState()?.profileId ?? null;
  }

  getUserId(): number | null {
    return this.sessionState()?.userId ?? null;
  }

  getCurrentUser(): AuthSession | null {
    return this.sessionState();
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const role = this.sessionState()?.role;
    return Boolean(role && allowedRoles.includes(role));
  }

  getCitizenId(): number | null {
    return this.getProfileIdForRole('CITIZEN');
  }

  getReceptionistId(): number | null {
    return this.getProfileIdForRole('MUNICIPAL_RECEPTIONIST');
  }

  getCleaningStaffId(): number | null {
    return this.getProfileIdForRole('CLEANING_OPERATIONS');
  }

  private getProfileIdForRole(role: UserRole): number | null {
    const session = this.sessionState();
    return session?.role === role ? session.profileId : null;
  }

  private saveSession(session: LoginResponse): void {
    localStorage.setItem('token', session.token);
    localStorage.setItem('userId', String(session.userId));
    localStorage.setItem('profileId', String(session.profileId));
    localStorage.setItem('role', session.role);
    localStorage.setItem('fullName', session.fullName);
    localStorage.setItem('email', session.email);
    this.sessionState.set(session);
  }

  private readSession(): AuthSession | null {
    const token = localStorage.getItem('token');
    const userId = Number(localStorage.getItem('userId'));
    const profileId = Number(localStorage.getItem('profileId'));
    const role = localStorage.getItem('role') as UserRole | null;
    const fullName = localStorage.getItem('fullName');
    const email = localStorage.getItem('email');

    if (!token || !userId || !profileId || !role || !fullName || !email) {
      return null;
    }

    return { token, userId, profileId, role, fullName, email };
  }
}
