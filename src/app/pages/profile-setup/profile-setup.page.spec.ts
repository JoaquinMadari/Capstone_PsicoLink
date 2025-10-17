import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileSetupPage } from './profile-setup.page';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { Catalog, SpecialtyOption } from 'src/app/services/catalog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

// ==== MOCKS ====
const routerMock = { navigate: jasmine.createSpy('navigate') };

const activatedRouteMock = {
  snapshot: { paramMap: { get: (_key: string) => null } }
};

const toastControllerMock = {
  create: jasmine.createSpy('create').and.returnValue(
    Promise.resolve({ present: jasmine.createSpy('present').and.returnValue(Promise.resolve()) })
  )
};

const catalogMock = {
  getSpecialties: jasmine.createSpy('getSpecialties').and.returnValue(
    of([
      { value: 'psicologia_clinica', label: 'Psicología Clínica' },
      { value: 'psicopedagogia', label: 'Psicopedagogía' }
    ] as SpecialtyOption[])
  )
};

// ==== TESTS ====
describe('ProfileSetupPage', () => {
  let component: ProfileSetupPage;
  let fixture: ComponentFixture<ProfileSetupPage>;
  let http: HttpClient;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        ProfileSetupPage,
        HttpClientTestingModule
      ],
      providers: [
        FormBuilder,
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: Catalog, useValue: catalogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;

    // Inyectar HttpClient y crear spy UNA sola vez
    http = TestBed.inject(HttpClient);
    spyOn(http, 'post').and.returnValue(of({}));
    
    fixture.detectChanges(); // ejecuta ngOnInit
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should send POST when saving valid patient profile', fakeAsync(() => {
    // Rellenar formulario con valores válidos
    component.paForm.patchValue({
      rut: '12345678-5',
      age: 30,
      gender: 'M',
      nationality: 'chilena',
      phone: '+56912345678',
      inclusive_orientation: false,
      base_disease: 'ninguna',
      disability: false,
      description: '',
      consultation_reason: '',
      preference_modality: '',
      preferred_focus: ''
    });

    component.paForm.updateValueAndValidity();
    fixture.detectChanges();

    component.savePatient();
    tick();

    expect(http.post).toHaveBeenCalledWith(
      jasmine.stringMatching(/\/profile\/setup\/$/),
      jasmine.objectContaining({ rut: '12345678-5' }),
      jasmine.any(Object)
    );
  }));

  it('should send POST when saving valid professional profile', fakeAsync(() => {
  component.proForm.patchValue({
    rut: '12345678-5',
    age: 40,
    gender: 'F',
    nationality: 'chilena',
    phone: '+56987654321',
    specialty: 'psicologia_clinica',
    specialty_other: '',
    license_number: '12345',
    main_focus: 'Terapia familiar',
    therapeutic_techniques: 'CBT',
    style_of_attention: 'Online',
    attention_schedule: 'Lunes a viernes',
    work_modality: 'Remota',
    inclusive_orientation: false,
    languages: 'Español',
    experience_years: 5
  });

  component.proForm.updateValueAndValidity();
  fixture.detectChanges();

  // NO volvemos a espiar http.post
  component.saveProfessional();
  tick();

  // Usamos directamente http.post
  expect(http.post).toHaveBeenCalledWith(
    jasmine.stringMatching(/\/profile\/setup\/$/),
    jasmine.objectContaining({
      rut: '12345678-5',
      specialty: 'psicologia_clinica'
    }),
    jasmine.any(Object)
  );
}));


});





















