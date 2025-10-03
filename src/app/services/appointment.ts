import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Appointment {
  private apiUrl = 'http://localhost:8000/api'; // Cambia a la URL de Render en despliegue

    constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token'); 

        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        
        return headers;
    }

    //Crear cita (POST)
    createAppointment(data: any): Observable<any> {
        return this.http.post(
            `${this.apiUrl}/appointments/`, 
            data, 
            { headers: this.getAuthHeaders() } // Añadir encabezados
        );
    }

    //Listar citas (GET)
    getAppointments(): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/appointments/`,
            { headers: this.getAuthHeaders() } // Añadir encabezados
        );
    }

    //Detalle de cita (GET)
    getAppointment(id: number): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/appointments/${id}/`,
            { headers: this.getAuthHeaders() } // Añadir encabezados
        );
    }

    //Cancelar/editar cita (PUT)
    updateAppointment(id: number, data: any): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/appointments/${id}/`, 
            data,
            { headers: this.getAuthHeaders() } // Añadir encabezados
        );
    }

    //Eliminar cita (DELETE)
    deleteAppointment(id: number): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/appointments/${id}/`,
            { headers: this.getAuthHeaders() } // Añadir encabezados
        );
    }
}