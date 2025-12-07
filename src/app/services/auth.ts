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
    // Login en Django (JWT), intento de signIn en Supabase
    return this.http.post(`${this.apiUrl}/auth/login/`, payload).pipe(
      tap((res: any) => {
        // Guarda tokens y rol
        if (res.access) localStorage.setItem('access', res.access);
        if (res.refresh) localStorage.setItem('refresh', res.refresh);

        const fullName = res?.user?.full_name || `${res?.user?.first_name || ''} ${res?.user?.last_name || ''}`.trim();
        if (fullName) localStorage.setItem('user_full_name', fullName);
        if (res?.user?.email) localStorage.setItem('user_email', res.user.email);
    

      // Guardar tokens si existen
      if (res.access) localStorage.setItem('access', res.access);
      if (res.refresh) localStorage.setItem('refresh', res.refresh);

        const role = res?.user?.role ?? res?.role ?? null;
        if (role) {
          localStorage.setItem('role', role);
          localStorage.setItem('user_role', role);
        }

        const isStaff = res?.is_staff ?? res?.user?.is_staff ?? false;
        localStorage.setItem('user_is_staff', String(isStaff));

      // Guardar Supabase UID si existe
      const sbUid = res?.user?.supabase_uid ?? null;
      if (sbUid) {
        localStorage.setItem('sb_uid', String(sbUid));
      } else {
        // Esto solo ocurriría si el sync falló en Django y no hay UID
        console.warn('UID de Supabase no recibida del backend.');
      }

      // 2. Guardar los tokens de Supabase (vienen de LoginView de Django)
      const sbAccessToken = res.supabase_access_token;
      const sbRefreshToken = res.supabase_refresh_token;

      if (sbAccessToken && sbRefreshToken) {
        localStorage.setItem('supabase_access_token', sbAccessToken);
        localStorage.setItem('supabase_refresh_token', sbRefreshToken);
      } else {
        console.warn('Tokens de sesión de Supabase no recibidos del backend.');
      }

      // ---------- GUARDAR USER_ID ----------
      let userId = res?.user?.id ?? res?.id ?? null;

      if (!userId && res?.user) {
        // Si el backend no manda id, pero hay algún identificador alternativo
        console.warn('No se encontró user.id en la respuesta', res.user);
      }

      if (userId) {
        console.log('Guardando user_id en localStorage:', userId);
        localStorage.setItem('user_id', String(userId));
      } else {
        console.warn('user_id no guardado: backend no devolvió id');
      }
    }),
    
    /*mergeMap((res: any) =>
      from(this.chatSb.signIn(payload.email, payload.password)).pipe(
        catchError(err => {
          console.warn('Supabase sign-in falló:', err?.message || err);
          return of(null);
        }),
        map(() => res)
      )
    )
    */

      mergeMap((res: any) => 
        from(this.initSupabaseSession()).pipe(
          catchError(err => {
            console.warn('Fallo al inicializar sesión de Supabase:', err);
            return of(null);
          }),
        map(() => res) // Retorna la respuesta original de Django para el flujo
        )
      )
    );
  }


  async logout(): Promise<void> {
    try {
      await this.chatSb.supabaseSignOut();
    } catch (e) {
      console.warn('supabase signOut:', e);
    }

    // Limpia todo
    ['access', 'refresh', 'role', 'access_token', 'refresh_token', 'user_role', 'user_id', 'user_full_name', 'user_email', 'sb_uid', 'user_is_staff']
      .forEach(k => localStorage.removeItem(k));
  }

  // ---------- Helpers ----------
  getCurrentUserRole(): Observable<string | null> {
    return of(localStorage.getItem('role') ?? localStorage.getItem('user_role'));
  }

  completeProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/setup/`, data);
  }

  //arreglo sesion supabase
  async initSupabaseSession(): Promise<void> {
        const sbAccessToken = localStorage.getItem('supabase_access_token');
        const sbRefreshToken = localStorage.getItem('supabase_refresh_token');

        if (sbAccessToken && sbRefreshToken) {
            try {
                // Llama a setSession. El SDK de Supabase manejará la actualización si el token está vencido.
                await this.chatSb.setSession(sbAccessToken, sbRefreshToken);
                console.log('Sesión de Supabase reestablecida.');
            } catch (e) {
                console.error('Fallo al reestablecer la sesión de Supabase (IGNORANDO):', e);
            }
        }
    }
}
