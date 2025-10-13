import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular'; // <-- aquí
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, 
  IonItem, IonLabel, IonSelectOption, IonList, 
  IonInfiniteScroll, IonInfiniteScrollContent 
} from '@ionic/angular/standalone';
import { SearchService } from '../../services/search';

// 🔹 Tipos de la respuesta de la API
interface Profesional {
  id: number;
  name: string;
  specialty: string;
  // agrega más campos según tu API
}

interface SearchResponse {
  results: Profesional[];
  count?: number;
  next?: string;
  previous?: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class SearchPage implements OnInit {
  form: FormGroup; // <-- Reactive Form para filtros
  profesionales: Profesional[] = [];
  query = '';
  filters = { specialty: '' };
  ordering = '';
  page = 1;

  constructor(
    public searchService: SearchService,
    private fb: FormBuilder // <-- inyectamos FormBuilder
  ) {
    // Inicializamos el FormGroup
    this.form = this.fb.group({
      specialtyFilter: ['']
    });
  }

  ngOnInit() {
    this.loadResults();
  }

  loadResults(event?: any) {
    this.searchService
      .search(this.query, this.filters, this.ordering, this.page)
      .subscribe((res: SearchResponse) => {
        if (this.page === 1) {
          this.profesionales = res.results;
        } else {
          this.profesionales.push(...res.results);
        }

        if (event) {
          event.target.complete();
        }
      });
  }

  onSearchChange(event: any) {
    this.query = event.detail.value;
    this.page = 1;
    this.loadResults();
  }

  applyFilter() {
    // Tomamos el valor del FormControl en vez de ngModel
    this.filters.specialty = this.form.value.specialtyFilter;
    this.page = 1;
    this.loadResults();
  }

  loadMore(event: any) {
    this.page += 1;
    this.loadResults(event);
  }
}

