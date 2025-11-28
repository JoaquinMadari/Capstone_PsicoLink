import { TestBed } from '@angular/core/testing';
import { SoporteService, SupportPayload, ReplyPayload } from './soporte';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

describe('SoporteService', () => {
  let service: SoporteService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SoporteService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SoporteService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock del localStorage para todas las pruebas
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (key === 'access_token') return 'fake-token-123';
      return null;
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- PRUEBAS DE CREACIÓN Y LECTURA (Usuario) ---

  it('submitTicket should POST to correct URL with Auth headers', () => {
    const payload: SupportPayload = { name: 'User', email: 'u@test.com', message: 'Help', subject: 'Bug' };
    
    service.submitTicket(payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/support/tickets/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    
    // Verificar que se añadieron los headers de autenticación
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token-123');
    req.flush({});
  });

  it('getTicketsByUser should GET from correct URL', () => {
    service.getTicketsByUser().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/support/mis-tickets/`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTicketDetails should GET specific ticket ID', () => {
    const ticketId = 5;
    service.getTicketDetails(ticketId).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/support/mis-tickets/${ticketId}/`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  // --- PRUEBAS DE ADMIN (Soporte) ---

  it('replyToTicket should PATCH with Auth headers', () => {
    const ticketId = 10;
    const reply: ReplyPayload = { respuesta: 'Solucionado' };

    service.replyToTicket(ticketId, reply).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/support/tickets/${ticketId}/reply/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(reply);
    expect(req.request.headers.has('Authorization')).toBeTrue();
    req.flush({});
  });

  it('getTicketsForAdmin should GET with Auth headers', () => {
    service.getTicketsForAdmin().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/support/admin/tickets/`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token-123');
    req.flush([]);
  });

  it('getTicketDetailsForAdmin should GET specific ID', () => {
    const adminTicketId = 99;
    service.getTicketDetailsForAdmin(adminTicketId).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/support/admin/tickets/${adminTicketId}/`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  // --- PRUEBAS DE GESTIÓN DE USUARIOS (Admin) ---

  it('getUsersForAdmin should return list of users', () => {
    const mockUsers = [{ id: 1, email: 'admin@test.com' }];
    
    service.getUsersForAdmin().subscribe(users => {
      expect(users.length).toBe(1);
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/users/`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    req.flush(mockUsers);
  });

  it('updateUser should PATCH user data', () => {
    const userId = 5;
    const changes = { is_active: false };

    service.updateUser(userId, changes).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/admin/users/${userId}/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(changes);
    expect(req.request.headers.has('Authorization')).toBeTrue();
    req.flush({});
  });

});
