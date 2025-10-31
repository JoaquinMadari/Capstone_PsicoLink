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
    //Login en Django (JWT), Intento de signIn en Supabase
    return this.http.post(`${this.apiUrl}/auth/login/`, payload).pipe(
      tap((res: any) => {
        // Guarda SIEMPRE con estas claves
        if (res.access)  localStorage.setItem('access',  res.access);
        if (res.refresh) localStorage.setItem('refresh', res.refresh);
        const role = res?.user?.role ?? res?.role ?? null;
        if (role) localStorage.setItem('role', role);
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
    // Cierra sesión en Supabase
    try { await this.chatSb.supabaseSignOut(); } catch (e) { console.warn('supabase signOut:', e); }

    // Limpia TODAS las variantes que se usaron antes
    ['access','refresh','role','access_token','refresh_token','user_role'].forEach(k =>
      localStorage.removeItem(k)
    );
  }

  // ---------- Helpers ----------
  getCurrentUserRole(): Observable<string | null> {
    return of(localStorage.getItem('role'));
  }

  completeProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/setup/`, data);
  }
}
