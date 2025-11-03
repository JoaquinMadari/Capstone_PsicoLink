import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class MercadoPago {

  // 🔴 ¡OJO! Esta es la URL de tu backend.
  // Ajusta el endpoint a como lo tengas en urls.py
  private backendUrl = 'http://localhost:8000/payments/create-preference/'; 

  constructor(private http: HttpClient) { }

  crearPreferencia(dataDeLaCita: any): Observable<any> {
    
    // 2. Obtener el token de acceso (ajusta la 'key' si la guardaste con otro nombre)
    const token = localStorage.getItem('access_token'); 

    // 3. Crear las cabeceras (Headers)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // ¡Aquí está la magia!
      'Authorization': `Bearer ${token}` 
    });

    // 4. Enviar la petición POST con los datos Y las cabeceras
    return this.http.post<any>(this.backendUrl, dataDeLaCita, { headers: headers });
  }
}

