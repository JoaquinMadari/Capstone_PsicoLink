import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  // ---------- AUTH ----------
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data);
  }

  login(payload: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/auth/login/`, payload).pipe(
      tap((res: any) => {
        if (res.access) localStorage.setItem('access_token', res.access);
        if (res.refresh) localStorage.setItem('refresh_token', res.refresh);
        if (res.role) localStorage.setItem('user_role', res.role);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // ---------- NUEVOS MÉTODOS PARA PROFILE-SETUP ----------
  
  getCurrentUserRole(): Observable<string | null> {
    const role = localStorage.getItem('user_role'); 
    return of(role); // Observable simulado
  }

  completeProfile(data: any): Observable<any> {
    // Envía los datos del perfil al backend
    return this.http.post(`${this.apiUrl}/profile/setup/`, data);
  }
}


