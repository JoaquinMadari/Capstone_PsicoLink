import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketsPage } from './tickets.page';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { SoporteService } from 'src/app/services/soporte';
import { of } from 'rxjs';
import { ToastController } from '@ionic/angular';

describe('TicketsPage', () => {
  let component: TicketsPage;
  let fixture: ComponentFixture<TicketsPage>;

  // 🧪 Mocks necesarios
  const mockActivatedRoute = {
    snapshot: { paramMap: { get: () => '1' } } // simula /tickets/1
  };

  const mockSoporteService = {
    getTicketDetailsForAdmin: jasmine.createSpy('getTicketDetailsForAdmin').and.returnValue(
      of({
        id: 1,
        status: 'abierto',
        created_at: '2025-01-01',
        message: 'Mensaje',
        respuesta: ''
      } as any)
    ),
    replyToTicket: jasmine.createSpy('replyToTicket').and.returnValue(of({}))
  };

  const mockToastCtrl = {
    create: jasmine.createSpy('create').and.returnValue(
      Promise.resolve({ present: () => {} })
    )
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketsPage],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SoporteService, useValue: mockSoporteService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // -------------------------------------------
  // 🧪 PRUEBA 1: el componente se crea
  // -------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

