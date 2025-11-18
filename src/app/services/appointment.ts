import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BusyInterval { id: number; start: string; end: string; }
export interface BusyResponse { professional: BusyInterval[]; patient: BusyInterval[]; }
export interface AppointmentNote { id: number; text: string; fecha: string; appointment: number; }


@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.API_URL;

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
    return this.http.patch(`${this.apiUrl}/appointments/${id}/`, data, {
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

  // ============================================
  // NUEVOS MÉTODOS PARA NOTAS MÚLTIPLES
  // ============================================

  // Crear nueva nota (POST)
  createAppointmentNote(appointmentId: number, text: string): Observable<AppointmentNote> {
    const data = {
      appointment: appointmentId,  //  Importante: incluir el appointment_id
      text: text                   //  Ahora se llama "text" en lugar de "notes"
    };

    return this.http.post<AppointmentNote>(
      `${this.apiUrl}/appointments/notes/create/`,  // Nueva URL
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  // Obtener todas las notas de una cita (GET)
  getAppointmentNotesList(appointmentId: number): Observable<AppointmentNote[]> {
    return this.http.get<AppointmentNote[]>(
      `${this.apiUrl}/appointments/${appointmentId}/notes/`,  //  Nueva URL
      { headers: this.getAuthHeaders() }
    );
  }

  // ============================================
  // MÉTODOS OBSOLETOS - ELIMINAR O MANTENER POR COMPATIBILIDAD
  // ============================================

  //  OBSOLETO: Obtener solo el campo 'notes' de la cita (campo simple)
  getAppointmentNotes(id: number): Observable<{ notes: string }> {
    return this.http.get<{ notes: string }>(
      `${this.apiUrl}/appointments/${id}/`,
      { headers: this.getAuthHeaders() }
    );
  }

  // OBSOLETO: Actualizar campo 'notes' simple (PATCH)
  updateAppointmentNotes(id: number, notes: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/appointments/${id}/notes/`,
      { notes },
      { headers: this.getAuthHeaders() }
    );
  }

  closeAppointment(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointments/${id}/close/`, {}, { headers: this.getAuthHeaders() }); 
  }
}