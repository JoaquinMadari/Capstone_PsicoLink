import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';


// Ajusta tu base URL (o usa environment.apiUrl)
const API_URL: string = environment.API_URL

export interface ProfessionalSummary {
  id: number;
  username: string;
  email: string;
  role: 'profesional' | 'paciente' | 'organizacion' | 'admin';
  specialty?: string | null;
  full_name?: string | null;
}

export interface ProfessionalProfile {
  user: ProfessionalSummary;

  // Perfil del psicólogo (PsicologoProfile)
  rut: string;
  age: number;
  gender: string;
  nationality: string;
  phone: string;

  specialty: string;
  license_number: string;
  main_focus: string;
  therapeutic_techniques: string;
  style_of_attention: string;
  attention_schedule: string;      // Si se cambia a JSON en backend, se coloca Record<string, any>
  work_modality: string;

  certificates?: string | null;    // Si luego vuelves a FileField, será una URL
  inclusive_orientation: boolean;
  languages?: string | null;
  experience_years?: number | null;
  curriculum_vitae?: string | null;

  cases_attended?: number;
  rating?: number;                 // decimal 0–5 aprox
}

@Injectable({ providedIn: 'root' })
export class ProfessionalService {
  private http = inject(HttpClient);

  private authHeaders(): HttpHeaders {
    // Ajusta el nombre de la key donde guardas tu JWT
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  /** Lista de profesionales con filtros opcionales */
  getProfessionals(opts?: {
    search?: string;
    specialty?: string;
    available?: boolean; 
  }): Observable<ProfessionalSummary[]> {
    let params = new HttpParams();
    if (opts?.search) params = params.set('search', opts.search);
    if (opts?.specialty) params = params.set('psicologoprofile__specialty', opts.specialty);
    if (opts?.available === true) params = params.set('available', 'true');

    return this.http.get<ProfessionalSummary[]>(
      `${API_URL}/professionals/`,
      { headers: this.authHeaders(), params }
    );
  }

  getProfessionalDetail(userId: number): Observable<ProfessionalProfile> {
    return this.http.get<any>(`${API_URL}/professionals/${userId}/`, {
      headers: this.authHeaders(),
    }).pipe(
      map((raw) => {
        if (raw?.user && raw?.rut) return raw as ProfessionalProfile;

        if (raw?.user && raw?.profile) {
          return { user: raw.user, ...raw.profile } as ProfessionalProfile;
        }

        return raw as ProfessionalProfile;
      })
    );
  }
}
