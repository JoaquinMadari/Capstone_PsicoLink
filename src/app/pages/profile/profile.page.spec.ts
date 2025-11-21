/// <reference types="jasmine" />

import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { IonicModule, ToastController } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfessionalService } from 'src/app/services/professional-service';
import { Location } from '@angular/common';

// Mock ProfessionalService
const professionalServiceMock = {
  getProfessionalDetail: jasmine
    .createSpy('getProfessionalDetail')
    .and.returnValue(of({}))
};

// Mock ActivatedRoute
const activatedRouteMock = {
  snapshot: { paramMap: { get: () => '123' } }
};

// Mock Router
const routerMock = {
  events: of(), // evita subscripciones reales
  navigate: jasmine.createSpy('navigate')
};

// Mock Location
const locationMock = {
  getState: () => ({})
};

// Mock ToastController
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
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        ProfilePage // standalone component
      ],
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
    fixture.detectChanges(); // dispara ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});





