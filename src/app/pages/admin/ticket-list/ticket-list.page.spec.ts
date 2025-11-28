import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketListPage } from './ticket-list.page';
import { of } from 'rxjs';
import { SoporteService } from 'src/app/services/soporte';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TicketListPage', () => {
  let component: TicketListPage;
  let fixture: ComponentFixture<TicketListPage>;

  // Mock SoporteService
  const mockSoporteService = {
    getTicketsForAdmin: jasmine.createSpy('getTicketsForAdmin').and.returnValue(
      of([
        {
          id: 1,
          name: 'User',
          email: 'test@example.com',
          subject: 'Test',
          message: 'Mensaje largo de prueba',
          created_at: '2024-01-01T00:00:00Z',
          status: 'abierto',
          respuesta: null
        }
      ])
    )
  };

  // Mock Router
  const mockRouter = {
    events: of()
  };

  const mockLocation = {
    getState: () => ({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TicketListPage],
      providers: [
        { provide: SoporteService, useValue: mockSoporteService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketListPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loadTickets should fetch and sort tickets', () => {
    component.loadTickets();
    expect(mockSoporteService.getTicketsForAdmin).toHaveBeenCalled();
    expect(component.tickets.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('getSummary should shorten long messages', () => {
    const msg = 'a'.repeat(70);
    const result = component.getSummary(msg);
    expect(result.endsWith('...')).toBeTrue();
    expect(result.length).toBe(50);
  });

  it('getStatusColor should return correct color', () => {
    expect(component.getStatusColor('cerrado')).toBe('success');
    expect(component.getStatusColor('en_proceso')).toBe('warning');
    expect(component.getStatusColor('abierto')).toBe('medium');
  });

  it('getStatusIcon should return correct icon', () => {
    expect(component.getStatusIcon('cerrado')).toBe('checkmark-circle-outline');
    expect(component.getStatusIcon('en_proceso')).toBe('hourglass-outline');
    expect(component.getStatusIcon('abierto')).toBe('help-circle-outline');
  });
});


