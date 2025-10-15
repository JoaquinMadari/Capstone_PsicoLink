import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileSetupPage } from './profile-setup.page';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from 'src/app/services/auth';
import { Catalog, SpecialtyOption } from 'src/app/services/catalog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfessionalService } from 'src/app/services/professional-service';

// Mock del AuthService
const authServiceMock = {
  getCurrentUserRole: () => of('paciente'),
  completeProfile: (data: any) => of({ success: true })
};

// Mock del Router
const routerMock = {
  navigate: jasmine.createSpy('navigate')
};

// Mock del ToastController
const toastControllerMock = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present')
  }))
};

// Mock del Catalog
const catalogMock = {
  getSpecialties: jasmine.createSpy('getSpecialties').and.returnValue(of([
    { value: 'psicologia_clinica', label: 'Psicología Clínica' },
    { value: 'psicopedagogia', label: 'Psicopedagogía' }
  ] as SpecialtyOption[]))
};

// Mock del ProfessionalService (si tus tests lo necesitan)
const professionalServiceMock = {
  getProfessionals: jasmine.createSpy('getProfessionals').and.returnValue(of([])),
  getProfessionalDetail: jasmine.createSpy('getProfessionalDetail').and.returnValue(of({}))
};

describe('ProfileSetupPage', () => {
  let component: ProfileSetupPage;
  let fixture: ComponentFixture<ProfileSetupPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileSetupPage,
        IonicModule.forRoot(),
        ReactiveFormsModule,
        HttpClientTestingModule // <- Provee HttpClient para los servicios y el componente
      ],
      providers: [
        FormBuilder,
        { provide: Auth, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: Catalog, useValue: catalogMock },
        { provide: ProfessionalService, useValue: professionalServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize paciente form correctly', () => {
    expect(component.paForm).toBeTruthy();
    expect(component.paForm.contains('rut')).toBeTrue();
    expect(component.paForm.contains('base_disease')).toBeTrue();
  });

  it('should initialize profesional form correctly', () => {
    expect(component.proForm).toBeTruthy();
    expect(component.proForm.contains('specialty')).toBeTrue();
    expect(component.proForm.contains('license_number')).toBeTrue();
  });

  it('should not call savePatient if paciente form is invalid', () => {
    const postSpy = spyOn(component['http'], 'post').and.callThrough();
    component.paForm.patchValue({ rut: '' }); // inválido
    component.savePatient();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('should save paciente if form is valid', () => {
    const postSpy = spyOn(component['http'], 'post').and.returnValue(of({}));
    component.paForm.patchValue({
      rut: '12345678-9',
      age: 30,
      gender: 'M',
      nationality: 'chilena',
      phone: '123456789',
      base_disease: 'ninguna'
    });

    component.savePatient();
    expect(postSpy).toHaveBeenCalled();
  });

  it('should save profesional if form is valid', () => {
    const postSpy = spyOn(component['http'], 'post').and.returnValue(of({}));
    component.proForm.patchValue({
      rut: '87654321-0',
      age: 40,
      gender: 'F',
      nationality: 'chilena',
      phone: '987654321',
      specialty: 'psicologia_clinica',
      license_number: '12345',
      main_focus: 'Terapia familiar',
      therapeutic_techniques: 'CBT',
      style_of_attention: 'Online',
      attention_schedule: 'Lunes a viernes',
      work_modality: 'Remota'
    });

    component.saveProfessional();
    expect(postSpy).toHaveBeenCalled();
  });
});







