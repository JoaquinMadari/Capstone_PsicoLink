/// <reference types="jasmine" />

import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { IonicModule, ToastController } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfessionalService, ProfessionalProfile } from '../../services/professional-service';
import { Location } from '@angular/common';

// Mock completo de ProfessionalProfile
const mockProfessionalData: ProfessionalProfile = {
  user: { id: 123, full_name: 'Test User', username: 'testuser', email: 'test@test.com', role: 'profesional' },
  rut: '12345678-9',
  age: 30,
  gender: 'M',
  nationality: 'Chilena',
  phone: '+56912345678',
  specialty: 'Psicología Clínica',
  license_number: 'ABC123',
  main_focus: 'Ansiedad y Depresión',
  therapeutic_techniques: 'CBT',
  style_of_attention: 'Individual',
  attention_schedule: 'Lunes a Viernes 9-18',
  work_modality: 'Online',
  certificates: null,
  inclusive_orientation: true,
  languages: 'Español',
  experience_years: 5,
  curriculum_vitae: null,
  cases_attended: 200,
  rating: 4.8
};

// Mock del service
const professionalServiceMock = {
  getProfessionalDetail: jasmine.createSpy('getProfessionalDetail').and.returnValue(
    of(mockProfessionalData)
  )
};

// Otros mocks
const activatedRouteMock = { snapshot: { paramMap: { get: () => '123' } } };
const routerMock = { events: of(), navigate: jasmine.createSpy('navigate') };
const locationMock = { getState: () => ({}) };
const toastControllerMock = {
  create: jasmine.createSpy('create').and.returnValue(
    Promise.resolve({ present: jasmine.createSpy('present') })
  )
};

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HttpClientTestingModule, ProfilePage],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ProfessionalService, useValue: professionalServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
        { provide: ToastController, useValue: toastControllerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;

    // dispara ngOnInit
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load professional data', () => {
    expect(component.data).toBeDefined();
    expect(component.data?.user.full_name).toBe('Test User');
    expect(component.data?.specialty).toBe('Psicología Clínica');
  });

  it('should set loading to false after data is loaded', () => {
    expect(component.loading).toBeFalse();
  });
});







