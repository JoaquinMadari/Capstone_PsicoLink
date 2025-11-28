import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisTicketsPage } from './mis-tickets.page';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

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
      created_at: '2025-01-01T10:00:00Z',
      status: 'abierto',
      respuesta: null
    },
    {
      id: 2,
      name: 'Usuario 2',
      email: 'user2@test.com',
      subject: 'Asunto 2',
      message: 'Mensaje 2',
      created_at: '2025-01-02T10:00:00Z',
      status: 'cerrado',
      respuesta: 'Respuesta'
    }
  ];

  beforeEach(async () => {
    // Crear spy de SoporteService
    soporteServiceSpy = jasmine.createSpyObj('SoporteService', ['getTicketsByUser']);
    soporteServiceSpy.getTicketsByUser.and.returnValue(of(mockTickets));

    await TestBed.configureTestingModule({
      imports: [
        MisTicketsPage,
        RouterTestingModule.withRoutes([]) // Provee un Router real de testing
      ],
      providers: [
        { provide: SoporteService, useValue: soporteServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
        { provide: Location, useValue: { getState: () => ({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisTicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit y carga tickets
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


});




