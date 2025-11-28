import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MisCitasPage } from './mis-citas.page';
import { AppointmentService } from 'src/app/services/appointment';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ToastController, IonicModule, NavController, Platform } from '@ionic/angular';

describe('MisCitasPage', () => {
  let component: MisCitasPage;
  let fixture: ComponentFixture<MisCitasPage>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastController: jasmine.SpyObj<ToastController>;
  let mockNavCtrl: jasmine.SpyObj<NavController>;
  let mockPlatform: jasmine.SpyObj<Platform>;

  const mockAppointments = [
    {
      id: 1,
      start_datetime: new Date(Date.now() - 3600000).toISOString(),
      end_datetime: new Date(Date.now() - 1800000).toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      patient_detail: { full_name: 'Paciente 1' },
      professional_detail: { full_name: 'Profesional 1' }
    },
    {
      id: 2,
      start_datetime: new Date(Date.now() + 3600000).toISOString(),
      end_datetime: new Date(Date.now() + 7200000).toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      patient_detail: { full_name: 'Paciente 2' },
      professional_detail: { full_name: 'Profesional 2' }
    }
  ];

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getAppointments',
      'updateAppointment',
      'closeAppointment'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);
    mockNavCtrl = jasmine.createSpyObj('NavController', ['navigateForward', 'navigateBack']);
    mockPlatform = jasmine.createSpyObj('Platform', ['ready']);

    mockPlatform.ready.and.returnValue(Promise.resolve('READY'));

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MisCitasPage
      ],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastController },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: Platform, useValue: mockPlatform }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisCitasPage);
    component = fixture.componentInstance;

    mockToastController.create.and.returnValue(
      Promise.resolve({ present: () => Promise.resolve() } as any)
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });



  it('should cancel an appointment', fakeAsync(() => {
    mockAppointmentService.updateAppointment.and.returnValue(of({}));
    mockAppointmentService.getAppointments.and.returnValue(of(mockAppointments));

    const targetId = mockAppointments[0].id;

    component.cancel(targetId);
    tick();

    expect(mockAppointmentService.updateAppointment)
      .toHaveBeenCalledWith(targetId, { status: 'cancelled' });

    expect(mockAppointmentService.getAppointments).toHaveBeenCalled();
  }));

  it('should navigate to mis-notas', () => {
    const appointmentId = 123;
    component.goToNotas(appointmentId);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/mis-notas', appointmentId]);
  });


});
































