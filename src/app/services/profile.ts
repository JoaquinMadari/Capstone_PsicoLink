import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = (environment.API_URL || '').replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/me/`);
  }

  updateMyProfile(payload: { email?: string; phone?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/profile/me/`, payload);
  }
}
