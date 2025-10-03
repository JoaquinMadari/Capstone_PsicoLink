import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class Auth {
 private apiUrl = 'http://localhost:8000/api/auth'; // cambia a la URL de Render en despliegue

  constructor(private http: HttpClient) {}

  // ---------- AUTH ----------
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  login(data: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, data).pipe(
      tap((response: any) => {
        //GUARDAR LOS TOKENS DESPUÉS DEL LOGIN EXITOSO
        if (response.access) {
          localStorage.setItem('access_token', response.access);
          // Opcional: guardar refresh token
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
  //añadir una redirección a la página de login
  }
}

