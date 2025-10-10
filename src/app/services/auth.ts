import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
 private apiUrl = 'http://localhost:8000/api'; 

   constructor(private http: HttpClient, private router: Router) {} 

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  // ---------- REGISTRO E INICIO DE SESIÓN ----------
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data);
  }

  login(data: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login/`, data).pipe(
      tap((response: any) => {
        if (response.access) {
          localStorage.setItem('access_token', response.access);
          if (response.refresh) {
            localStorage.setItem('refresh_token', response.refresh);
          }
          if (response.user && response.user.role) { 
            localStorage.setItem('user_role', response.user.role);
          }
        }
      })
    );
  }

  /** Envía los datos restantes del perfil (Rut, Especialidad, etc.) al backend seguro. */
  completeProfile(data: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    
    // 1. Crear las cabeceras aquí, si hay token.
    let headers = new HttpHeaders();
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // 2. Usar la nueva instancia de headers
    return this.http.post(
        `${this.apiUrl}/profile/setup/`, 
        data, 
        { headers: headers }
    );
  }


  /** * Simula la obtención del rol. En producción, DEBE decodificar el JWT 
   * o hacer una llamada a /api/user/details para obtener el rol actual.
   */
  getCurrentUserRole(): Observable<string | null> {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');

    if (token && role) {
        return of(role); 
    }
    return of(null);
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    
    this.router.navigate(['/login']); 
  }
}

