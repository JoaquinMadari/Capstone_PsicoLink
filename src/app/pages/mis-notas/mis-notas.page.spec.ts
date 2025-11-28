import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisNotasPage } from './mis-notas.page';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';
import { AppointmentService } from 'src/app/services/appointment';
import { IonicModule, ToastController } from '@ionic/angular';

describe('MisNotasPage', () => {
  let component: MisNotasPage;
  let fixture: ComponentFixture<MisNotasPage>;

  let mockAppointmentService: any;
  const mockActivatedRoute = { snapshot: { paramMap: { get: () => '99' } } };
  const mockLocation = { getState: () => ({}) };

  beforeEach(async () => {
    // Creamos un mock fresco por cada test
    mockAppointmentService = {
      getAppointment: jasmine.createSpy().and.returnValue(
        of({ id: 99, status: 'completed', historial: [] })
      ),
      getAppointmentNotesList: jasmine.createSpy().and.returnValue(
        of([{ id: 1, text: 'Nota de prueba', fecha: '2025-01-01T10:00:00Z' }])
      ),
      createAppointmentNote: jasmine.createSpy().and.returnValue(
        of({ id: 2, text: 'Nueva Nota', fecha: '2025-01-02T12:00:00Z' })
      )
    };

    await TestBed.configureTestingModule({
      imports: [MisNotasPage, IonicModule.forRoot()],
      providers: [
        ToastController,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisNotasPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // 🔥 necesario para que se ejecute ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});





