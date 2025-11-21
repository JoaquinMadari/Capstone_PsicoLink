import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MisNotasPage } from './mis-notas.page';
import { AppointmentService, AppointmentNote } from 'src/app/services/appointment';
import { of, throwError } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

describe('MisNotasPage', () => {
  let component: MisNotasPage;
  let fixture: ComponentFixture<MisNotasPage>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;
  let toastCtrl: jasmine.SpyObj<ToastController>;

  const fakeAppointmentId = 123;
  const fakeNote: AppointmentNote = {
    id: 1,
    text: 'Nota de prueba',
    fecha: new Date().toISOString(),
    appointment: fakeAppointmentId,
  };

  beforeEach(async () => {
    const appointmentServiceSpy = jasmine.createSpyObj('AppointmentService', [
      'getAppointment', 
      'createAppointmentNote',
      'getAppointmentNotesList'
    ]);

    const toastCtrlSpy = jasmine.createSpyObj('ToastController', ['create']);

    await TestBed.configureTestingModule({
      imports: [MisNotasPage],
      providers: [
        { provide: AppointmentService, useValue: appointmentServiceSpy },
        { provide: ToastController, useValue: toastCtrlSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => String(fakeAppointmentId) } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisNotasPage);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService) as jasmine.SpyObj<AppointmentService>;
    toastCtrl = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;

    // Spies básicos
    appointmentService.getAppointment.and.returnValue(of({ status: 'completed' }));
    appointmentService.getAppointmentNotesList.and.returnValue(of([fakeNote]));
    appointmentService.createAppointmentNote.and.callFake(
      (appointmentId: number, text: string) => of({ ...fakeNote, appointment: appointmentId, text })
    );

    // Toast mock
    toastCtrl.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve()
    } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointment and notes on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.status).toBe('completed');
    expect(component.historialNotas.length).toBe(1);
    expect(component.historialNotas[0].text).toBe('Nota de prueba');
    expect(component.isVisible).toBe(true); // porque rol profesional por default
  }));

  it('should add a new note', fakeAsync(() => {
    component.nuevaNota = 'Nueva nota de prueba';
    component.canEdit = true;

    component.guardarNota();
    tick();

    expect(component.historialNotas.length).toBe(2); // la original + nueva
    expect(component.historialNotas[1].text).toBe('Nueva nota de prueba');
    expect(component.nuevaNota).toBe('');
  }));

  it('should not add empty note', fakeAsync(() => {
    component.nuevaNota = '   ';
    component.canEdit = true;

    component.guardarNota();
    tick();

    expect(component.historialNotas.length).toBe(0);
  }));

  it('should not add note if cannot edit', fakeAsync(() => {
    component.nuevaNota = 'Nota';
    component.canEdit = false;

    component.guardarNota();
    tick();

    expect(component.historialNotas.length).toBe(0);
  }));
});


