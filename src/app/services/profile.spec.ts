import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  // Se calcula la URL base esperada usando la misma lógica que en el servicio
  const rawUrl = environment.API_URL || '';
  const expectedBaseUrl = rawUrl.replace(/\/$/, '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica que no queden peticiones pendientes
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- PRUEBA DEL GET (Obtener Perfil) ---
  it('getMyProfile should send a GET request to correct URL', () => {
    const mockProfile = { id: 1, email: 'test@test.com', name: 'User' };

    // Llamada al método
    service.getMyProfile().subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    // Se intercepta la petición
    // Esperamos: URL_BASE + /profile/me/
    const req = httpMock.expectOne(`${expectedBaseUrl}/profile/me/`);
    
    // Se verifica el método
    expect(req.request.method).toBe('GET');

    // Se devuelve respuesta simulada
    req.flush(mockProfile);
  });

  // --- PRUEBA DEL PATCH (Actualizar Perfil) ---
  it('updateMyProfile should send a PATCH request with payload', () => {
    const payload = { phone: '12345678' };
    const mockResponse = { success: true, ...payload };

    // Llamada al método
    service.updateMyProfile(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    // Se intercepta la petición
    const req = httpMock.expectOne(`${expectedBaseUrl}/profile/me/`);

    // Se verifica método y cuerpo (body)
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);

    // Se devuelve respuesta simulada
    req.flush(mockResponse);
  });
});
