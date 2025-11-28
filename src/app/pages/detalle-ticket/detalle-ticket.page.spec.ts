import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DetalleTicketPage } from './detalle-ticket.page';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('DetalleTicketPage', () => {
  let component: DetalleTicketPage;
  let fixture: ComponentFixture<DetalleTicketPage>;
  let soporteServiceSpy: jasmine.SpyObj<SoporteService>;

  const ticketMock: SupportTicket = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@example.com',
    subject: 'Problema con la app',
    message: 'No puedo iniciar sesión',
    created_at: '2025-11-19T10:00:00Z',
    status: 'abierto',
    respuesta: null
  };

  beforeEach(async () => {
  const spy = jasmine.createSpyObj('SoporteService', ['getTicketDetails']);

  await TestBed.configureTestingModule({
    imports: [
      DetalleTicketPage,
      RouterTestingModule
    ],
    providers: [
      { provide: SoporteService, useValue: spy },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: () => '1'
            }
          }
        }
      }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(DetalleTicketPage);
  component = fixture.componentInstance;
  soporteServiceSpy = TestBed.inject(SoporteService) as jasmine.SpyObj<SoporteService>;
});


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load ticket details on init', fakeAsync(() => {
    soporteServiceSpy.getTicketDetails.and.returnValue(of(ticketMock));

    component.ngOnInit();
    tick();

    expect(component.ticket).toEqual(ticketMock);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
    expect(soporteServiceSpy.getTicketDetails).toHaveBeenCalledWith(1);
  }));

  it('should handle error when loading ticket fails', fakeAsync(() => {
    soporteServiceSpy.getTicketDetails.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();
    tick();

    expect(component.ticket).toBeNull();
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('No se pudo cargar el detalle del ticket.');
  }));

  it('getStatusColor should return correct color', () => {
    expect(component.getStatusColor('abierto')).toBe('medium');
    expect(component.getStatusColor('en_proceso')).toBe('warning');
    expect(component.getStatusColor('cerrado')).toBe('success');
  });

  it('getStatusLabel should return correct label', () => {
    expect(component.getStatusLabel('abierto')).toBe('Abierto');
    expect(component.getStatusLabel('en_proceso')).toBe('En Progreso');
    expect(component.getStatusLabel('cerrado')).toBe('Resuelto');
  });
});



