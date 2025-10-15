import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BusyInterval { id: number; start: string; end: string; }
export interface BusyResponse { professional: BusyInterval[]; patient: BusyInterval[]; }


@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api'; // Cambia en despliegue

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('access');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  
  getProfessionals(): Observable<any> {
    return this.http.get(`${this.apiUrl}/search/`, { headers: this.getAuthHeaders() }); 
  }

  createAppointment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments/`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointment(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/${id}/`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAppointment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/appointments/${id}/`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBusy(professionalId: number, dateISO: string): Observable<BusyResponse> {
    const params = new HttpParams()
      .set('professional', professionalId)
      .set('date', dateISO);
    return this.http.get<BusyResponse>(`${this.apiUrl}/appointments/busy/`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

}