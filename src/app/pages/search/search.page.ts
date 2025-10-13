import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonItem, IonLabel,
  IonSelect, IonSelectOption ,IonList,IonInfiniteScrollContent,IonInfiniteScroll, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs'; // Necesario para evitar búsquedas excesivas

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    // Módulos Ionic
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonItem, IonLabel,
    IonSelect, IonSelectOption ,IonList,IonInfiniteScrollContent,IonInfiniteScroll,
    IonBackButton, IonButtons,
    RouterModule 
  ]
})
export class SearchPage implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private fb = inject(FormBuilder); 

  searchForm: FormGroup; 
  profesionales: any[] = [];
  page = 1;

  constructor() {
    this.searchForm = this.fb.group({
      query: [''], 
      specialty: [''] 
    });
  }

  ngOnInit() {
    this.searchForm.valueChanges
      .pipe(
        startWith(this.searchForm.value),
        debounceTime(150), 
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)) 
      )
      .subscribe(() => {
        this.page = 1; 
        this.loadResults();
      });
  }

  loadResults(event?: any) {
    const { query, specialty } = this.searchForm.value; 

    const filters = { specialty: specialty };
    const ordering = '';

    this.searchService.search(query, filters, ordering, this.page).subscribe({
      next: (res: any) => {
        const newResults = res.results || res;
        
        if (this.page === 1) {
          this.profesionales = newResults;
        } else {
          this.profesionales.push(...newResults);
        }
    
        if (event && event.target) {
          event.target.complete();
          if (res && !res.next) { 
            event.target.disabled = true; 
          } else {
            event.target.disabled = false;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar resultados:', err);
        if (event) event.target.complete();
      }
    });
  }

  loadMore(event: any) {
    this.page += 1;
    this.loadResults(event);
  }
  
  goToAgendar(professionalId: number) {
    this.router.navigate(['/Agendar'], { 
        queryParams: { professionalId: professionalId } 
    });
  }

}
