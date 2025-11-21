import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TicketListPage } from './ticket-list.page';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';

describe('TicketListPage', () => {
  let component: TicketListPage;
  let fixture: ComponentFixture<TicketListPage>;
  let soporteService: jasmine.SpyObj<SoporteService>;

  beforeEach(waitForAsync(() => {
    const soporteSpy = jasmine.createSpyObj('SoporteService', ['getTicketsForAdmin']);

    TestBed.configureTestingModule({
      imports: [TicketListPage, RouterTestingModule],
      providers: [
        { provide: SoporteService, useValue: soporteSpy },
        {
          provide: Location,
          useValue: {
            getState: () => ({ from: null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketListPage);
    component = fixture.componentInstance;
    soporteService = TestBed.inject(SoporteService) as jasmine.SpyObj<SoporteService>;

    fixture.detectChanges();
  }));

  // -------------------------------------------
  // 🧪 PRUEBA 1: el componente se crea
  // -------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------
  // 🧪 PRUEBA 2: carga de tickets correctamente
  // -------------------------------------------
  it('should load tickets and sort them', () => {
    const mockTickets: SupportTicket[] = [
    { id: 1, status: 'cerrado', created_at: '2025-01-01', message: 'ok' } as any,
    { id: 2, status: 'abierto', created_at: '2025-03-01', message: 'nuevo' } as any,
    { id: 3, status: 'en_proceso', created_at: '2025-02-01', message: 'proceso' } as any,
    ];


    soporteService.getTicketsForAdmin.and.returnValue(of(mockTickets));

    component.loadTickets();

    expect(component.loading).toBeFalse();
    expect(component.tickets.length).toBe(3);

    // Orden esperado → primero los abiertos, luego por fecha descendente
    expect(component.tickets[0].id).toBe(2);
    expect(component.tickets[1].id).toBe(3);
    expect(component.tickets[2].id).toBe(1);
  });

  // -------------------------------------------
  // 🧪 PRUEBA 3: error al cargar tickets
  // -------------------------------------------
  it('should handle error on loadTickets', () => {
    soporteService.getTicketsForAdmin.and.returnValue(throwError(() => new Error('fail')));

    component.loadTickets();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('No se pudieron cargar los tickets del sistema.');
  });

  // -------------------------------------------
  // 🧪 PRUEBA 4: getStatusColor
  // -------------------------------------------
  it('should return correct status color', () => {
    expect(component.getStatusColor('cerrado')).toBe('success');
    expect(component.getStatusColor('en_proceso')).toBe('warning');
    expect(component.getStatusColor('abierto')).toBe('medium');
  });

  // -------------------------------------------
  // 🧪 PRUEBA 5: getStatusIcon
  // -------------------------------------------
  it('should return correct status icon', () => {
    expect(component.getStatusIcon('cerrado')).toBe('checkmark-circle-outline');
    expect(component.getStatusIcon('en_proceso')).toBe('hourglass-outline');
    expect(component.getStatusIcon('abierto')).toBe('help-circle-outline');
  });

  // -------------------------------------------
  // 🧪 PRUEBA 6: getSummary
  // -------------------------------------------
  it('should shorten long messages', () => {
    const longMsg = 'a'.repeat(100);
    const result = component.getSummary(longMsg);

    expect(result.endsWith('...')).toBeTrue();
    expect(result.length).toBe(50);
  });

  it('should not shorten short messages', () => {
    const msg = 'Hola mundo';
    expect(component.getSummary(msg)).toBe(msg);
  });
});

