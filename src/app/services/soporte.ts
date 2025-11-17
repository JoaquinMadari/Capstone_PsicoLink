import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SupportPayload {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export interface SupportTicket {
  id: number;
  user?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'abierto' | 'en_proceso' | 'cerrado';
  respuesta: string | null;
}

export interface ReplyPayload {
    respuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class SoporteService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('access');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  submitTicket(payload: SupportPayload): Observable<any> {
    const url = `${this.apiUrl}/support/tickets/`; 
    return this.http.post(url, payload, { headers: this.getAuthHeaders() });
  }

  getTicketsByUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/support/mis-tickets/`);
  }

  getTicketDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/support/mis-tickets/${id}/`);
  }

  //ADMIN

  //detalle de UN ticket para admin
  getTicketDetailsForAdmin(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/support/admin/tickets/${id}/`);
  }

  replyToTicket(ticketId: number, payload: ReplyPayload): Observable<any> {
    const url = `${this.apiUrl}/support/tickets/${ticketId}/reply/`;
    return this.http.patch(url, payload, { headers: this.getAuthHeaders() });
  }

  //Lista de tickets ADMIN
  getTicketsForAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/support/admin/tickets/`, { headers: this.getAuthHeaders() });
  }



  //GESTION DE USUARIOS
  getUsersForAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users/`, { headers: this.getAuthHeaders() });
  }

  getUserDetailForAdmin(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/users/${id}/`, { headers: this.getAuthHeaders() });
  }

  updateUser(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/users/${id}/`, payload, { headers: this.getAuthHeaders() });
  }
}