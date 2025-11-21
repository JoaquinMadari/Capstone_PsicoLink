import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MisCitasPage } from './mis-citas.page';
import { AppointmentService, AppointmentNote } from 'src/app/services/appointment';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

describe('MisCitasPage', () => {
  let component: MisCitasPage;
  let fixture: ComponentFixture<MisCitasPage>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastController: jasmine.SpyObj<ToastController>;

  const mockAppointments = [
    {
      id: 1,
      start_datetime: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hora atrás
      end_datetime: new Date(Date.now() - 1000 * 30 * 60).toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      patient_detail: { full_name: 'Paciente 1' },
      professional_detail: { full_name: 'Profesional 1' }
    },
    {
      id: 2,
      start_datetime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hora en futuro
      end_datetime: new Date(Date.now() + 1000 * 120 * 60).toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      patient_detail: { full_name: 'Paciente 2' },
      professional_detail: { full_name: 'Profesional 2' }
    }
  ];

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getAppointments', 'updateAppointment', 'closeAppointment'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);

    await TestBed.configureTestingModule({
      imports: [MisCitasPage],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisCitasPage);
    component = fixture.componentInstance;

    // Mock del toast
    mockToastController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', fakeAsync(() => {
    mockAppointmentService.getAppointments.and.returnValue(of(mockAppointments));
    component.ngOnInit();
    tick();
    expect(component.appointments.length).toBe(2);
    expect(mockAppointmentService.getAppointments).toHaveBeenCalled();
  }));

  it('should cancel an appointment', fakeAsync(() => {
    mockAppointmentService.updateAppointment.and.returnValue(of({}));
    mockAppointmentService.getAppointments.and.returnValue(of(mockAppointments));

    component.cancel(mockAppointments[0].id);
    tick();

    expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith(mockAppointments[0].id, { status: 'cancelled' });
    expect(mockAppointmentService.getAppointments).toHaveBeenCalled();
  }));

  it('should navigate to mis-notas', () => {
    const appointmentId = 123;
    component.goToNotas(appointmentId);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/mis-notas', appointmentId]);
  });

  it('should open Zoom link', () => {
    spyOn(window, 'open');
    const url = 'https://zoom.us/test';
    component.joinMeeting(url);
    expect(window.open).toHaveBeenCalledWith(url, '_blank');
  });

  it('should not open Zoom if url is empty', fakeAsync(() => {
    spyOn(window, 'open');
    component.joinMeeting('');
    tick();
    expect(window.open).not.toHaveBeenCalled();
  }));
});

































