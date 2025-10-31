import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Catalog, SpecialtyOption } from 'src/app/services/catalog';
import { environment } from 'src/environments/environment';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonSelectOption, IonToggle, IonSelect, IonTextarea } from '@ionic/angular/standalone';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule } from '@angular/router';


/* ===========================
   VALIDADORES
   =========================== */

/** no solo espacios */
const notBlank = (): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const v = (c.value ?? '').toString();
  return v.trim().length ? null : { blank: true };
};

/** máx. longitud tras trim */
const maxLenTrim = (len: number): ValidatorFn => (c: AbstractControl) => {
  const v = (c.value ?? '').toString().trim();
  return v.length <= len ? null : { maxlength: { requiredLength: len } };
};

/** RUT chileno con DV (acepta puntos y guión) */
const rutValidator = (): ValidatorFn => (c: AbstractControl) => {
  const raw = (c.value ?? '').toString().trim();
  if (!raw) return { required: true };
  const val = raw.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(val)) return { rut: true };

  const body = val.slice(0, -1);
  const dv = val.slice(-1);
  let sum = 0, mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const mod = 11 - (sum % 11);
  const dvCalc = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
  return dvCalc === dv ? null : { rut: true };
};

/** Teléfono Chile: +56 9 XXXXXXXX (admite espacios y +) */
const phoneClValidator = (): ValidatorFn => (c: AbstractControl) => {
  const v = (c.value ?? '').toString().trim().replace(/\s+/g, '');
  if (!v) return { required: true };
  // admite +56 9xxxxxxxx o 9xxxxxxxx
  return /^(?:\+?56)?9\d{8}$/.test(v) ? null : { phone: true };
};

/* ===========================
   HELPERS DE NORMALIZACIÓN
   =========================== */

function normalizeRut(raw: string): string {
  if (!raw) return '';
  const val = raw.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (val.length < 2) return raw.trim();
  const body = val.slice(0, -1);
  const dv = val.slice(-1);
  return `${body}-${dv}`;
}

function normalizePhoneCL(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D+/g, '');
  if (digits.startsWith('56')) {
    // 56 9 xxxxxxxx
    return `+${digits}`;
  }
  if (digits.startsWith('9') && digits.length === 9) {
    // 9xxxxxxxx
    return `+56${digits}`;
  }
  // fallback: si ya venía con +56 mantenerlo, si no, devolver como estaba
  return raw.trim();
}


@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.page.html',
  styleUrls: ['./profile-setup.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonSelectOption,
    IonToggle, IonSelect, IonTextarea,RouterModule
  ]
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

    this.catalog.getSpecialties().subscribe((list) => (this.specialties = list || []));

    /* ===========================
            FORM PROFESIONAL
       =========================== */
    this.proForm = this.fb.group({
      rut: ['', [rutValidator()]],
      age: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
      gender: ['', [Validators.required]],
      nationality: ['', [notBlank(), maxLenTrim(50)]],
      phone: ['', [phoneClValidator()]],

      specialty: ['', [Validators.required]],
      specialty_other: [''],

      license_number: ['', [notBlank(), maxLenTrim(50)]],
      main_focus: ['', [notBlank(), maxLenTrim(100)]],
      therapeutic_techniques: ['', [notBlank(), maxLenTrim(2000)]],
      style_of_attention: ['', [notBlank(), maxLenTrim(2000)]],
      attention_schedule: ['', [notBlank(), maxLenTrim(255)]],
      work_modality: ['', [Validators.required]],

      inclusive_orientation: [false],
      languages: ['', [maxLenTrim(255)]],
      experience_years: [null, [Validators.min(0), Validators.max(60)]]
    });

    // specialty === 'otro' → specialty_other requerido (≤100)
    this.proForm.get('specialty')!.valueChanges.subscribe((val) => {
      const ctrl = this.proForm.get('specialty_other')!;
      if (val === 'otro') {
        ctrl.addValidators([notBlank(), maxLenTrim(100)]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity();
    });

    /* ===========================
            FORM PACIENTE
       =========================== */
    this.paForm = this.fb.group({
      rut: ['', [rutValidator()]],
      age: [null, [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', [Validators.required]],
      nationality: ['', [notBlank(), maxLenTrim(50)]],
      phone: ['', [phoneClValidator()]],
      inclusive_orientation: [false],

      base_disease: ['', [notBlank(), maxLenTrim(100)]],
      disability: [false],

      description: ['', [maxLenTrim(2000)]],
      consultation_reason: ['', [maxLenTrim(100)]],
      preference_modality: [''],
      preferred_focus: ['', [maxLenTrim(100)]]
    });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access');
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  /* ===========================
     SUBMITS (normalizando datos)
     =========================== */

  saveProfessional() {
  console.log('saveProfessional called');  // log inicial

  this.proForm.markAllAsTouched();

  // revisar validez del formulario
  if (!this.proForm.valid) {
    console.log('Form invalid, errors per control:');
    Object.keys(this.proForm.controls).forEach(key => {
      console.log(key, this.proForm.controls[key].errors);
    });
    return;
  }

  console.log('Form valid, proceeding');

  const raw = this.proForm.value;
  const payload: any = {
    ...raw,
    rut: normalizeRut(raw.rut || ''),
    phone: normalizePhoneCL(raw.phone || ''),
    experience_years:
      raw.experience_years === '' || raw.experience_years === null || raw.experience_years === undefined
        ? null
        : Number(raw.experience_years)
  };

  // si no es "otro", no enviar specialty_other
  if (payload.specialty !== 'otro') {
    delete payload.specialty_other;
  }

  console.log('About to call POST with payload:', payload);

  // usar this['http'] para que spy funcione
  this['http'].post(`${this.api}/profile/setup/`, payload, { headers: this.authHeaders() }).subscribe({
    next: () => {
      console.log('POST success, navigating home');
      this.router.navigate(['/tabs/home']);
    },
    error: (err) => console.error('Error guardando perfil profesional', err)
  });
}


  savePatient() {
    this.paForm.markAllAsTouched();
    if (!this.paForm.valid) return;

    const raw = this.paForm.value;
    const payload: any = {
      ...raw,
      rut: normalizeRut(raw.rut || ''),
      phone: normalizePhoneCL(raw.phone || '')
    };

    this.http.post(`${this.api}/profile/setup/`, payload, { headers: this.authHeaders() }).subscribe({
      next: () => this.router.navigate(['/tabs/home']),
      error: (err) => console.error('Error guardando perfil paciente', err)
    });
  }
}




