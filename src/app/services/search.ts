import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl: string = environment.API_URL;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    // ... (Tu lógica para obtener el token JWT)
    const token = localStorage.getItem('access');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  search(query: string, filters: any = {}, ordering: string = '', page: number = 1): Observable<any> {
    let params = new HttpParams()
      .set('search', query || '')
      .set('page', page.toString());

    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });

    if (ordering) params = params.set('ordering', ordering);

    return this.http.get(`${this.apiUrl}/search/`, { params, headers: this.getAuthHeaders() });
  }
}


