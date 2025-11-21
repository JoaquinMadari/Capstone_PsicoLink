import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoportePage } from './soporte.page';
import { SoporteService } from 'src/app/services/soporte';
import { ToastController } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';

describe('SoportePage', () => {
  let component: SoportePage;
  let fixture: ComponentFixture<SoportePage>;

  // Mock del servicio soporte
  const mockSoporteService = {
    submitTicket: jasmine.createSpy('submitTicket').and.returnValue(of({ ok: true }))
  };

  // Mock del ToastController
  const mockToastCtrl = {
    create: jasmine.createSpy('create').and.returnValue(
      Promise.resolve({ present: () => {} })
    )
  };

  // Mock del Router y eventos
  const routerEvents$ = new Subject<any>();
  const mockRouter = {
    events: routerEvents$.asObservable(),
    navigateByUrl: jasmine.createSpy('navigateByUrl')
  };

  // Mock de Location
  const mockLocation = {
    getState: () => ({})
  };

  beforeEach(async () => {
    // Mock de localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      switch (key) {
        case 'user_full_name':
          return 'Test User';
        case 'user_email':
          return 'test@example.com';
        case 'user_role':
          return 'paciente';
        default:
          return null;
      }
    });

    await TestBed.configureTestingModule({
      imports: [SoportePage],
      providers: [
        FormBuilder,
        { provide: SoporteService, useValue: mockSoporteService },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SoportePage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit()
  });

  // -------------------------------------------
  // 🧪 PRUEBA 1: El componente se crea
  // -------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

