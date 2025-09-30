import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
 private apiUrl = 'http://localhost:8000/api'; // cambia a la URL de Render en despliegue

  constructor(private http: HttpClient) {}

  // ---------- AUTH ----------
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, data);
  }

  // ---------- APPOINTMENTS ----------
  // Crear una cita
  createAppointment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments/`, data);
  }

  // Listar citas (por usuario o todas)
  getAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/`);
  }

  // Detalle de cita
  getAppointment(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/${id}/`);
  }

  // Cancelar/editar cita
  updateAppointment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/`, data);
  }

  // Eliminar cita
  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/appointments/${id}/`);
  }
}

