import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl: string = environment.API_URL;


  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  getProfessionals(): Observable<any> {
    // Usar HttpHeaders con el token JWT
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
}