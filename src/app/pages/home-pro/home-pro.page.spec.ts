import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomeProPage } from './home-pro.page';
import { AppointmentService } from 'src/app/services/appointment';
import { ProfessionalService } from 'src/app/services/professional-service';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('HomeProPage', () => {
  let component: HomeProPage;
  let fixture: ComponentFixture<HomeProPage>;
  let mockAppointmentSvc: jasmine.SpyObj<AppointmentService>;
  let mockProSvc: jasmine.SpyObj<ProfessionalService>;
  let mockToast: jasmine.SpyObj<ToastController>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockAppointments = [
    {
      id: 1,
      start_datetime: new Date().toISOString(),
      end_datetime: new Date().toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      patient: 1,
      professional: 2
    }
  ];

  beforeEach(async () => {
    mockAppointmentSvc = jasmine.createSpyObj('AppointmentService', ['getAppointments']);
    mockProSvc = jasmine.createSpyObj('ProfessionalService', ['getAvailabilityStatus', 'updateAvailability']);
    mockToast = jasmine.createSpyObj('ToastController', ['create']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeProPage],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentSvc },
        { provide: ProfessionalService, useValue: mockProSvc },
        { provide: ToastController, useValue: mockToast },
        { provide: HttpClient, useValue: {} },
        { provide: Router, useValue: mockRouter },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeProPage);
    component = fixture.componentInstance;

    mockToast.create.and.returnValue(Promise.resolve({ present: jasmine.createSpy() } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

 
});

