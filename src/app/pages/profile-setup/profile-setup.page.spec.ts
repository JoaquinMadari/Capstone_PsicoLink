import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileSetupPage } from './profile-setup.page';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Catalog } from 'src/app/services/catalog';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('ProfileSetupPage', () => {
  let component: ProfileSetupPage;
  let fixture: ComponentFixture<ProfileSetupPage>;

  const mockHttp = {
    post: jasmine.createSpy('post').and.returnValue(of({}))
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockCatalog = {
    getSpecialties: jasmine.createSpy('getSpecialties').and.returnValue(of([
      { value: 'psicologia', label: 'Psicología' },
      { value: 'otro', label: 'Otro' }
    ]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSetupPage],
      providers: [
        FormBuilder,
        { provide: HttpClient, useValue: mockHttp },
        { provide: Router, useValue: mockRouter },
        { provide: Catalog, useValue: mockCatalog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize proForm and paForm', () => {
    expect(component.proForm).toBeDefined();
    expect(component.paForm).toBeDefined();
    expect(component.proForm.controls['rut']).toBeDefined();
    expect(component.paForm.controls['rut']).toBeDefined();
  });

  it('should call http.post on saveProfessional with valid form', () => {
    component.proForm.setValue({
      rut: '12345678-9',
      age: 30,
      gender: 'M',
      nationality: 'Chilena',
      phone: '+56912345678',
      specialty: 'psicologia',
      specialty_other: '',
      license_number: '123',
      main_focus: 'Foco',
      therapeutic_techniques: 'Técnicas',
      style_of_attention: 'Estilo',
      session_price: 50000,
      work_modality: 'Online',
      inclusive_orientation: false,
      languages: 'Español',
      experience_years: 5
    });

    component.saveProfessional();

    expect(mockHttp.post).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should call http.post on savePatient with valid form', () => {
    component.paForm.setValue({
      rut: '12345678-9',
      age: 25,
      gender: 'F',
      nationality: 'Chilena',
      phone: '+56987654321',
      inclusive_orientation: false,
      base_disease: 'Ninguna',
      disability: false,
      description: 'Descripción',
      consultation_reason: 'Consulta',
      preference_modality: 'Online',
      preferred_focus: 'Foco'
    });

    component.savePatient();

    expect(mockHttp.post).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });
});






















