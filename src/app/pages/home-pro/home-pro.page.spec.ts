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

    // Toast create mock
    mockToast.create.and.returnValue(Promise.resolve({ present: jasmine.createSpy() } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments and availability on load', fakeAsync(() => {
    mockProSvc.getAvailabilityStatus.and.returnValue(of({ is_available: true }));
    mockAppointmentSvc.getAppointments.and.returnValue(of(mockAppointments));

    component.load();
    tick();

    expect(component.isAvailable()).toBeTrue();
    expect(component.upcoming.length).toBe(1);
    expect(component.pending.length).toBe(1);
    expect(component.kpis.hoursToday).toBeGreaterThan(0);
  }));

  it('should toggle availability successfully', fakeAsync(() => {
    mockProSvc.updateAvailability.and.returnValue(of({}));

    const event: any = { detail: { checked: false } };
    component.submittingAvailability = false;
    component.onToggleAvailability(event);
    tick();

    expect(component.isAvailable()).toBeFalse();
    expect(component.submittingAvailability).toBeFalse();
  }));

  it('should revert availability on toggle error', fakeAsync(() => {
    mockProSvc.updateAvailability.and.returnValue(throwError(() => new Error('Fail')));

    const event: any = { detail: { checked: false } };
    component.isAvailable.set(true);
    component.submittingAvailability = false;

    component.onToggleAvailability(event);
    tick();

    expect(component.isAvailable()).toBeTrue();
    expect(component.submittingAvailability).toBeFalse();
  }));

  it('should navigate to agenda, messages, support', () => {
    component.goAgenda();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pro/mis-citas']);

    component.goMessages();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pro/messages']);

    component.goSupport();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/soporte']);
  });

  it('should correctly identify same week', () => {
    const now = new Date();
    const sameWeek = new Date(now);
    const diffWeek = new Date(now);
    diffWeek.setDate(now.getDate() - 7);

    expect((component as any).isSameWeek(now, sameWeek)).toBeTrue();
    expect((component as any).isSameWeek(now, diffWeek)).toBeFalse();
  });
});

