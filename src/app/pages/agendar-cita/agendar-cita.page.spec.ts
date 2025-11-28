import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { AgendarCitaPage } from './agendar-cita.page';
import { AppointmentService } from 'src/app/services/appointment';
import { MercadoPago as MercadopagoService } from 'src/app/services/mercado-pago';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController, LoadingController, NavController } from '@ionic/angular/standalone';

// MOCKS DE SERVICIOS

class MockAppointmentService {
  getProfessionals() {
    return of({
      results: [
        { id: 1, name: 'Test Pro', work_modality: 'Online' }
      ]
    });
  }

  getAppointments() {
    return of([]);
  }

  getBusy() {
    return of({
      professional: [],
      patient: []
    });
  }

  updateAppointment() {
    return of({});
  }
}

class MockMercadoPagoService {
  crearPreferencia() {
    return of({ init_point: 'http://test.com' });
  }
}

class MockToastController {
  create() {
    return Promise.resolve({ present: () => Promise.resolve() });
  }
}

class MockAlertController {
  create() {
    return Promise.resolve({ present: () => Promise.resolve() });
  }
}

class MockLoadingController {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve()
    });
  }
}

// Router Mock con events (NECESARIO PARA IONIC NAVCONTROLLER)
const routerEvents$ = new Subject<any>();

const routerMock = {
  events: routerEvents$,
  navigate: jasmine.createSpy('navigate')
};

//ActivatedRoute completo
const activatedRouteMock = {
  snapshot: {
    paramMap: {
      get: () => '123'
    }
  },
  queryParams: of({})
};

// NavController Mock
const navControllerMock = {
  navigateForward: jasmine.createSpy('navigateForward'),
  navigateBack: jasmine.createSpy('navigateBack')
};

// TEST
describe('AgendarCitaPage', () => {
  let component: AgendarCitaPage;
  let fixture: ComponentFixture<AgendarCitaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendarCitaPage],
      providers: [
        { provide: AppointmentService, useClass: MockAppointmentService },
        { provide: MercadopagoService, useClass: MockMercadoPagoService },
        { provide: ToastController, useClass: MockToastController },
        { provide: AlertController, useClass: MockAlertController },
        { provide: LoadingController, useClass: MockLoadingController },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: NavController, useValue: navControllerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarCitaPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // Componente creado
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Carga profesionales
  it('should load professionals on init', () => {
    expect(component.professionals.length).toBeGreaterThan(0);
  });

  // Slots generados
  it('should generate slots', () => {
    expect(component.slots.length).toBeGreaterThan(0);
  });

  // Formulario inválido
  it('form should be invalid if no professional selected', () => {
    component.form.patchValue({
      professional: null,
      date: '2025-01-01',
      time: '10:00',
      duration: 50,
      modality: 'Online'
    });

    expect(component.form.valid).toBeFalse();
  });

  // Formulario válido
  it('form should be valid with correct data', () => {
    component.form.patchValue({
      professional: 1,
      date: '2025-01-01',
      time: '10:00',
      duration: 50,
      modality: 'Online'
    });

    expect(component.form.valid).toBeTrue();
  });
});












