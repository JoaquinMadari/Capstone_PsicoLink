import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class MercadoPago {

  private backendUrl = environment.MP_URL;

  constructor(private http: HttpClient) { }

  crearPreferencia(dataDeLaCita: any): Observable<any> {
    
    // Obtener el token de acceso
    const token = localStorage.getItem('access_token'); 

    // Crear Headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    });

    // Enviar la petición POST con los datos Y las cabeceras
    return this.http.post<any>(this.backendUrl, dataDeLaCita, { headers: headers });
  }
}

