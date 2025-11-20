/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountPage } from './account.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile';
import { Auth } from 'src/app/services/auth';
import { of } from 'rxjs';

// Mock Router
const routerMock = {
  navigate: jasmine.createSpy('navigate')
};

// Mock ProfileService
const profileServiceMock = {
  getMyProfile: jasmine.createSpy('getMyProfile').and.returnValue(
    of({
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@example.com',
      phone: '12345678',
      specialty: 'Psicología',
      role: 'paciente'
    })
  ),
  updateMyProfile: jasmine.createSpy('updateMyProfile').and.returnValue(
    of({})
  )
};

// Mock Auth Service
const authMock = {
  logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve())
};

// Mock AlertController
const alertCtrlMock = {
  create: jasmine
    .createSpy('create')
    .and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
};

describe('AccountPage', () => {
  let component: AccountPage;
  let fixture: ComponentFixture<AccountPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AccountPage,              // Standalone component
        HttpClientTestingModule,
        IonicModule.forRoot()
      ],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: Auth, useValue: authMock },
        { provide: AlertController, useValue: alertCtrlMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ejecuta ngOnInit → loadProfile()
  });

  // -------------------------------------------
  // 🧪 PRUEBA 1: el componente se crea
  // -------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


