import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendarCitaPage } from './agendar-cita.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppointmentService } from 'src/app/services/appointment';
import { ToastController, IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';

describe('AgendarCitaPage', () => {
  let component: AgendarCitaPage;
  let fixture: ComponentFixture<AgendarCitaPage>;
  let mockAppointmentService: any;
  let mockToastController: any;

  beforeEach(async () => {
    // ✅ Mock completo del servicio
    mockAppointmentService = {
      getAppointments: jasmine.createSpy('getAppointments').and.returnValue(of([]).pipe(take(1))),
      getProfessionals: jasmine.createSpy('getProfessionals').and.returnValue(of([]).pipe(take(1))),
      createAppointment: jasmine.createSpy('createAppointment').and.returnValue(of({}).pipe(take(1))),
      updateAppointment: jasmine.createSpy('updateAppointment').and.returnValue(of({}).pipe(take(1))),
      deleteAppointment: jasmine.createSpy('deleteAppointment').and.returnValue(of({}).pipe(take(1))),
      getBusy: jasmine.createSpy('getBusy').and.returnValue(of({
        professional: [
          { time: '10:00', start: '2025-10-15T10:00:00', end: '2025-10-15T10:30:00' },
          { time: '11:00', start: '2025-10-15T11:00:00', end: '2025-10-15T11:30:00' }
        ],
        patient: []
      }).pipe(take(1))) // ✅ datos válidos para map
    };

    // ✅ Mock del ToastController
    mockToastController = {
      create: jasmine.createSpy('create').and.returnValue(
        Promise.resolve({
          present: jasmine.createSpy('present')
        })
      )
    };

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
        AgendarCitaPage // standalone component
      ],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: ToastController, useValue: mockToastController },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarCitaPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy(); // ✅ Limpia el componente
    }
  });

  // ✅ Tests
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load professionals on init', () => {
    expect(mockAppointmentService.getProfessionals).toHaveBeenCalled();
    expect(component.professionals).toBeDefined();
  });

  it('should load appointments on init', () => {
    expect(mockAppointmentService.getAppointments).toHaveBeenCalled();
    expect(component.appointments).toEqual([]);
  });

  it('should call createAppointment on onCreate', () => {
    (component.form as any).patchValue({
      professional: 1,
      date: '2025-10-13',
      time: '10:00:00',
      duration: 50,
      modality: 'Presencial',
      reason: 'Consulta'
    });

    component.onCreate();
    expect(mockAppointmentService.createAppointment).toHaveBeenCalled();
  });

  it('should call getBusy and map results', () => {
    // pasamos parámetros correctos (professionalId y fecha)
    component.refreshBusy(1, '2025-10-15');
    expect(mockAppointmentService.getBusy).toHaveBeenCalledWith(1, '2025-10-15');
    expect(component.busyTimes).toEqual(['10:00', '11:00']); // asegura que map funciona
  });
});










