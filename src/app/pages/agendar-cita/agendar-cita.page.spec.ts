import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendarCitaPage } from './agendar-cita.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AppointmentService } from 'src/app/services/appointment';
import { ToastController } from '@ionic/angular';

describe('AgendarCitaPage', () => {
  let component: AgendarCitaPage;
  let fixture: ComponentFixture<AgendarCitaPage>;
  let mockAppointmentService: any;
  let mockToastController: any;

  beforeEach(async () => {
    mockAppointmentService = {
      getAppointments: jasmine.createSpy('getAppointments').and.returnValue(of([])),
      createAppointment: jasmine.createSpy('createAppointment').and.returnValue(of({})),
      updateAppointment: jasmine.createSpy('updateAppointment').and.returnValue(of({}))
    };

    mockToastController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
        present: () => Promise.resolve()
      }))
    };

    await TestBed.configureTestingModule({
      imports: [AgendarCitaPage, HttpClientTestingModule],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: ToastController, useValue: mockToastController },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } } // <-- mock de queryParams
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarCitaPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Esto ejecuta ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
    duration: 50
});

    component.onCreate();
    expect(mockAppointmentService.createAppointment).toHaveBeenCalled();
  });
});




