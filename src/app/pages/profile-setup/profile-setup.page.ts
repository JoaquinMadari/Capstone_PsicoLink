import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonSelectOption, IonToggle, IonSelect, IonTextarea  } from '@ionic/angular/standalone'
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Catalog, SpecialtyOption } from 'src/app/services/catalog';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.page.html',
  styleUrls: ['./profile-setup.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput,IonButton, IonSelectOption, IonToggle, IonSelect, IonTextarea ]
})
export class ProfileSetupPage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private catalog = inject(Catalog);

  viewerRole: 'profesional' | 'paciente' | 'organizacion' | 'admin' | undefined;
  specialties: SpecialtyOption[] = [];

  proForm!: FormGroup;
  paForm!: FormGroup;

  api = (environment.API_URL || '').replace(/\/$/, '');

  ngOnInit() {
    this.viewerRole = (localStorage.getItem('role') as any) || 'paciente';

    // Cargar catálogo
    this.catalog.getSpecialties().subscribe((list) => this.specialties = list || []);

    // Forms
    this.proForm = this.fb.group({
      rut: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
      gender: ['', Validators.required],
      nationality: ['', Validators.required],
      phone: ['', Validators.required],
      specialty: ['', Validators.required],
      specialty_other: [''],
      license_number: ['', Validators.required],
      main_focus: ['', Validators.required],
      therapeutic_techniques: ['', Validators.required],
      style_of_attention: ['', Validators.required],
      attention_schedule: ['', Validators.required],
      work_modality: ['', Validators.required],
      inclusive_orientation: [false],
      languages: [''],
      experience_years: [null]
    });

    // cuando cambia specialty, validar specialty_other
    this.proForm.get('specialty')!.valueChanges.subscribe(val => {
      const ctrl = this.proForm.get('specialty_other')!;
      if (val === 'otro') {
        ctrl.addValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity();
    });

    this.paForm = this.fb.group({
      rut: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', Validators.required],
      nationality: ['', Validators.required],
      phone: ['', Validators.required],
      inclusive_orientation: [false],
      base_disease: ['', Validators.required],
      disability: [false],
      description: [''],
      consultation_reason: [''],
      preference_modality: [''],
      preferred_focus: ['']
    });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access');
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  saveProfessional() {
    if (!this.proForm.valid) return;
    const payload = this.proForm.value;

    this.http.post(`${this.api}/profile/setup/`, payload, { headers: this.authHeaders() })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => console.error('Error guardando perfil profesional', err)
      });
  }

  savePatient() {
    if (!this.paForm.valid) return;
    const payload = this.paForm.value;

    this.http.post(`${this.api}/profile/setup/`, payload, { headers: this.authHeaders() })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => console.error('Error guardando perfil paciente', err)
      });
  }
}

