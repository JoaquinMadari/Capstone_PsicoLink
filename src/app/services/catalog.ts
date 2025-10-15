import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SpecialtyOption {
  value: string;
  label: string;
  requires_detail?: boolean;
}

@Injectable({ providedIn: 'root' })
export class Catalog {
  private http = inject(HttpClient);
  private readonly base = (environment.API_URL || '').replace(/\/$/, '');

  private specialties$?: Observable<SpecialtyOption[]>;

  getSpecialties(force = false): Observable<SpecialtyOption[]> {
    if (!this.specialties$ || force) {
      this.specialties$ = this.http
        .get<SpecialtyOption[]>(`${this.base}/specialties/`)
        .pipe(shareReplay(1));
    }
    return this.specialties$;
  }
}