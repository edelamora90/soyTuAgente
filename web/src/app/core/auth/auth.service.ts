// web/src/app/core/auth/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/auth`;

export type LoginResp = {
  user: { username: string; roles: string[]; name?: string };
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY  = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY    = 'user';
const NAME_KEY    = 'auth_name'; // ← para el header

function decodeJwt<T = any>(token: string): T | null {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}
function isExpired(token?: string | null): boolean {
  if (!token) return true;
  const p = decodeJwt<{ exp: number }>(token);
  if (!p?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return p.exp <= now;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Estado reactivo (rehidratado desde localStorage)
  user = signal<{ username: string; roles: string[]; name?: string } | null>(
    (() => {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    })()
  );

  get accessToken(): string | null { return localStorage.getItem(ACCESS_KEY); }
  get refreshToken(): string | null { return localStorage.getItem(REFRESH_KEY); }

  private setTokens(at: string, rt: string) {
    localStorage.setItem(ACCESS_KEY, at);
    localStorage.setItem(REFRESH_KEY, rt);
  }

  private setUser(u: { username: string; roles: string[]; name?: string }) {
    this.user.set(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    // nombre visible que usa el header como fallback
    const display = u.name || u.username || '';
    if (display) localStorage.setItem(NAME_KEY, display);
  }

  private clearName() {
    localStorage.removeItem(NAME_KEY);
  }

  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.clearName();
    this.user.set(null);
  }

  /** Para que el interceptor pueda forzar un cierre de sesión limpio */
  forceLogout() {
    this.clear();
  }

  // ---- login / refresh / helpers ----
  login(username: string, password: string): Observable<LoginResp> {
    return this.http.post<LoginResp>(`${API}/login`, { username, password }).pipe(
      tap(r => {
        this.setTokens(r.accessToken, r.refreshToken);
        this.setUser(r.user);
      })
    );
  }

  refresh(): Observable<{ accessToken: string; refreshToken: string }> {
    const rt = this.refreshToken ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${rt}` });
    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${API}/refresh`, {}, { headers })
      .pipe(tap(r => this.setTokens(r.accessToken, r.refreshToken)));
    // Nota: el usuario no suele cambiar en un refresh; por eso no tocamos USER_KEY aquí.
  }

  isLoggedIn(): boolean { return !!this.accessToken && !isExpired(this.accessToken); }

  async ensureValidSession(): Promise<boolean> {
    if (this.accessToken && !isExpired(this.accessToken)) return true;
    if (this.refreshToken && !isExpired(this.refreshToken)) {
      try { await firstValueFrom(this.refresh()); return true; }
      catch { this.clear(); return false; }
    }
    this.clear(); return false;
  }

  async getValidAccessToken(): Promise<string | null> {
    if (this.accessToken && !isExpired(this.accessToken)) return this.accessToken;
    if (this.refreshToken && !isExpired(this.refreshToken)) {
      try { const r = await firstValueFrom(this.refresh()); return r.accessToken; }
      catch { this.clear(); return null; }
    }
    this.clear(); return null;
  }

  logout() { this.clear(); }

  // ====== cambiar contraseña (como ya tenías) ======
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API}/change-password`, { old: oldPassword, next: newPassword });
  }

  // ====== actualizar perfil opcional ======
  updateProfile(payload: { name?: string; email?: string }): Observable<{ user: { username: string; roles: string[]; name?: string } }> {
    return this.http.post<{ user: { username: string; roles: string[]; name?: string } }>(`${API}/profile`, payload)
      .pipe(tap(res => this.setUser(res.user)));
  }
}
