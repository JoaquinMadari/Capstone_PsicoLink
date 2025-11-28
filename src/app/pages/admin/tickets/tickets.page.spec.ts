import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketsPage } from './tickets.page';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { SoporteService } from 'src/app/services/soporte';
import { of } from 'rxjs';
import { ToastController, NavController } from '@ionic/angular';

describe('TicketsPage', () => {
  let component: TicketsPage;
  let fixture: ComponentFixture<TicketsPage>;

  // 🔹 Mock ActivatedRoute (/tickets/1)
  const mockActivatedRoute = {
    snapshot: { paramMap: { get: () => '1' } }
  };

  // 🔹 Mock SoporteService
  const mockSoporteService = {
    getTicketDetailsForAdmin: jasmine.createSpy('getTicketDetailsForAdmin').and.returnValue(
      of({
        id: 1,
        status: 'abierto',
        created_at: '2025-01-01',
        message: 'Mensaje de prueba',
        respuesta: ''
      })
    ),
    replyToTicket: jasmine.createSpy('replyToTicket').and.returnValue(of({}))
  };

  // 🔹 Mock ToastController
  const mockToastCtrl = {
    create: jasmine.createSpy('create').and.returnValue(
      Promise.resolve({ present: () => {} })
    )
  };

  // 🔹 Mock Router
  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  // 🔹 Mock NavController (ION-BACK BUTTON NECESITA ESTO)
  const mockNavController = {
    back: jasmine.createSpy('back'),
    navigateForward: jasmine.createSpy('navigateForward'),
    navigateBack: jasmine.createSpy('navigateBack'),
    navigateRoot: jasmine.createSpy('navigateRoot')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketsPage],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SoporteService, useValue: mockSoporteService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: NavController, useValue: mockNavController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ejecuta ngOnInit()
  });

  // -------------------------------------------
  // 🧪 PRUEBAS
  // -------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
