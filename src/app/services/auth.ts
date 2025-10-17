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

  login(data: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login/`, data).pipe(
      tap((response: any) => {
        // GUARDAR LOS TOKENS DESPUÉS DEL LOGIN EXITOSO
        if (response.access) {
          localStorage.setItem('access_token', response.access);
          if (response.refresh) {
            localStorage.setItem('refresh_token', response.refresh);
          }
        }
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


