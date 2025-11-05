import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { tap, mergeMap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ChatSupabase } from './chat-supabase';

@Injectable({ providedIn: 'root' })
export class Auth {
  private apiUrl = (environment.API_URL || '').replace(/\/$/, '');

  constructor(private http: HttpClient, private chatSb: ChatSupabase) {}

  // ---------- AUTH ----------
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data);
  }

  login(payload: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/auth/login/`, payload).pipe(
      tap((res: any) => {
        if (res.access)  localStorage.setItem('access',  res.access);
        if (res.refresh) localStorage.setItem('refresh', res.refresh);

        const role = res?.user?.role ?? res?.role ?? null;
        if (role) {
          localStorage.setItem('role', role);
          localStorage.setItem('user_role', role);
        }

        const sbUid = res?.user?.supabase_uid ?? null;
        if (sbUid) localStorage.setItem('sb_uid', String(sbUid));
      }),
      mergeMap((res: any) =>
        from(this.chatSb.signIn(payload.email, payload.password)).pipe(
          catchError(err => {
            console.warn('Supabase sign-in falló:', err?.message || err);
            return of(null);
          }),
          map(() => res)
        )
      )
    );
  }

  async logout(): Promise<void> {
    try { await this.chatSb.supabaseSignOut(); } catch (e) { console.warn('supabase signOut:', e); }
    [
      'access', 'refresh', 'role', 'user_role',
      'access_token', 'refresh_token', 'sb_uid'
    ].forEach(k => localStorage.removeItem(k));
  }

  // ---------- Helpers ----------
  getCurrentUserRole(): Observable<string | null> {
    return of(localStorage.getItem('role') ?? localStorage.getItem('user_role'));
  }

  completeProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/setup/`, data);
  }
}