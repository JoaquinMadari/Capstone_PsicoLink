import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService { // ✅ export
  private apiUrl = 'http://localhost:8000/search/';

  constructor(private http: HttpClient) {}

  search(
    query: string,
    filters: any = {},
    ordering: string = '',
    page: number = 1
  ): Observable<any> {
    let params = new HttpParams()
      .set('search', query || '')
      .set('page', page.toString());

    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });

    if (ordering) params = params.set('ordering', ordering);

    return this.http.get(this.apiUrl, { params });
  }
}


