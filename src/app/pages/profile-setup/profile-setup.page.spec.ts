import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileSetupPage } from './profile-setup.page';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from 'src/app/services/auth';

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

describe('ProfileSetupPage', () => {
  let component: ProfileSetupPage;
  let fixture: ComponentFixture<ProfileSetupPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSetupPage, IonicModule.forRoot()], // standalone import
      providers: [
        FormBuilder,
        { provide: Auth, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastController, useValue: toastControllerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form for "paciente"', () => {
    component.initializeForm('paciente');
    expect(component.profileForm.contains('rut')).toBeTrue();
    expect(component.profileForm.contains('base_disease')).toBeTrue();
  });

  it('should call completeProfile and navigate on saveProfile', async () => {
    component.initializeForm('paciente');
    component.profileForm.patchValue({
      rut: '12345678-9',
      age: 30,
      gender: 'M',
      nationality: 'chilena',
      phone: '123456789',
      base_disease: 'ninguna',
      disability: false
    });

    await component.saveProfile();
    
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});




