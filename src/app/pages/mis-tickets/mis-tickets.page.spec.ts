import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisTicketsPage } from './mis-tickets.page';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';

describe('MisTicketsPage', () => {
  let component: MisTicketsPage;
  let fixture: ComponentFixture<MisTicketsPage>;
  let soporteServiceSpy: jasmine.SpyObj<SoporteService>;

  const mockTickets: SupportTicket[] = [
    {
      id: 1,
      name: 'Usuario 1',
      email: 'user1@test.com',
      subject: 'Asunto 1',
      message: 'Mensaje 1',
      created_at: '2025-01-01T10:00:00Z', // string
      status: 'abierto',
      respuesta: null
    },
    {
      id: 2,
      name: 'Usuario 2',
      email: 'user2@test.com',
      subject: 'Asunto 2',
      message: 'Mensaje 2',
      created_at: '2025-01-02T10:00:00Z', // string
      status: 'cerrado',
      respuesta: 'Respuesta'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('SoporteService', ['getTicketsByUser']);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RouterTestingModule],
      declarations: [MisTicketsPage],
      providers: [
        { provide: SoporteService, useValue: spy },
        Location
      ]
    }).compileComponents();

    soporteServiceSpy = TestBed.inject(SoporteService) as jasmine.SpyObj<SoporteService>;
    soporteServiceSpy.getTicketsByUser.and.returnValue(of(mockTickets));

    fixture = TestBed.createComponent(MisTicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit se ejecuta aquí
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tickets on init', () => {
    expect(component.tickets.length).toBe(2);
    expect(component.tickets[0].id).toBe(1);
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('abierto')).toBe('medium');
    expect(component.getStatusColor('en_proceso')).toBe('warning');
    expect(component.getStatusColor('cerrado')).toBe('success');
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon('abierto')).toBe('help-circle-outline');
    expect(component.getStatusIcon('en_proceso')).toBe('hourglass-outline');
    expect(component.getStatusIcon('cerrado')).toBe('checkmark-circle-outline');
  });

  it('should return summary for long message', () => {
    const longMsg = 'a'.repeat(100);
    expect(component.getSummary(longMsg).length).toBe(50);
  });
});



