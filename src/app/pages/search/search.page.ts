import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonItem, IonLabel,
  IonSelect, IonSelectOption ,IonList,IonInfiniteScrollContent,IonInfiniteScroll, IonBackButton, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search';
import { Catalog } from 'src/app/services/catalog';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { ToastController } from '@ionic/angular';


interface SpecialtyOption {
  value: string;
  label: string;
  requires_detail?: boolean;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonItem, IonLabel,
    IonSelect, IonSelectOption ,IonList,IonInfiniteScrollContent,IonInfiniteScroll,
    IonBackButton, IonButtons, IonButton, IonIcon,
    RouterModule 
  ]
})
export class SearchPage implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private catalog = inject(Catalog);

  searchForm: FormGroup;
  profesionales: any[] = [];
  page = 1;

  specialties: SpecialtyOption[] = [];

  workModalities = [
    { value: 'Online', label: 'Online' },
    { value: 'Presencial', label: 'Presencial' },
    { value: 'Mixta', label: 'Mixta' }
  ];
  
  inclusiveOptions = [
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' }
  ];

  experienceOptions = [0, 1, 3, 5, 10];

  constructor(private toastCtrl: ToastController) {
    this.searchForm = this.fb.group({
      query: [''],
      specialty: [''],
      workModality: [''],
      inclusiveOrientation: [''],
      minExperience: [null],
    });
  }

  ngOnInit() {
    this.catalog.getSpecialties().subscribe(list => {
      this.specialties = list || [];
    });

    this.searchForm.valueChanges
      .pipe(
        startWith(this.searchForm.value),
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(() => {
        this.page = 1;
        this.loadResults();
      });
  }

  loadResults(event?: any) {
    const { query, 
        specialty, 
        workModality, 
        inclusiveOrientation,
        minExperience } = this.searchForm.value as 
      { query: string; 
        specialty: string;
        workModality: string;
        inclusiveOrientation: string;
        minExperience: number; };

    const filters: Record<string, string> = {};
    if (specialty) {
      filters['specialty'] = specialty;
    }

    if (workModality) {
      filters['work_modality'] = workModality;
    }
    
    if (inclusiveOrientation) {
      filters['inclusive_orientation'] = inclusiveOrientation;
    }
    
    if (minExperience !== null && minExperience > 0) {
      filters['experience_years_gte'] = minExperience.toString();
    }

    const ordering = '';

    this.searchService.search(query, filters, ordering, this.page).subscribe({
      next: (res: any) => {
        const newResults = res?.results ?? res ?? [];
        this.profesionales = this.page === 1 ? newResults : [...this.profesionales, ...newResults];

        if (event?.target) {
          event.target.complete();
          event.target.disabled = !res?.next;
        }
      },
      error: (err) => {
        console.error('Error al cargar resultados:', err);
        if (event?.target) event.target.complete();
      }
    });
  }

  loadMore(event: any) {
    this.page += 1;
    this.loadResults(event);
  }

  goToProfile(professionalId: number) {
    this.router.navigate(['/profile', professionalId]);
  }

  goToAgendarFromList(event: Event, professionalId: number) {
    event.stopPropagation();
    this.router.navigate(['/Agendar'], { queryParams: { professionalId } });
  }


  resetAndLoad() {
    this.page = 1;
    this.searchForm.patchValue({ query: '' });
    this.loadResults();
  }

  trackByPro = (_: number, p: any) => p?.id ?? _;


  async startChat(event: Event, otherUid?: string) {
    event.stopPropagation();
    if (!otherUid) {
      const t = await this.toastCtrl.create({
        message: 'Este profesional aún no tiene chat disponible.',
        duration: 2000,
        color: 'medium'
      });
      await t.present();
      return;
    }

    const role = localStorage.getItem('user_role') || localStorage.getItem('role') || 'paciente';
    const base = role === 'profesional' ? '/pro' : '/tabs';

    this.router.navigate([base, 'chat', 'with', otherUid], {
      state: { from: '/search' }
    });
  }


}