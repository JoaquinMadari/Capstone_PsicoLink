import { TestBed } from '@angular/core/testing';
import { MercadoPago } from './mercado-pago';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

describe('MercadoPago Service', () => {
  let service: MercadoPago;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MercadoPago,
        provideHttpClient(),
        provideHttpClientTesting() 
      ]
    });

    service = TestBed.inject(MercadoPago);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica que no queden peticiones pendientes después de cada test
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('crearPreferencia debería hacer un POST con el token de autorización correcto', () => {
    // Preparar datos y mocks
    const mockDataCita = { id: 1, paciente: 'Juan', monto: 5000 };
    const mockResponse = { init_point: 'https://mercadopago.com/checkout/xyz' };
    const fakeToken = 'soy-un-token-falso-123';

    // Simular localStorage cuando el servicio pida 'access_token', se le asigna fakeToken
    spyOn(localStorage, 'getItem').and.returnValue(fakeToken);

    // Ejecutar el método
    service.crearPreferencia(mockDataCita).subscribe(resp => {
      expect(resp).toEqual(mockResponse);
    });

    // Verificar la petición HTTP
    const req = httpMock.expectOne(environment.MP_URL);

    // Verificar que sea método POST
    expect(req.request.method).toBe('POST');

    // Verificar que el cuerpo de la petición sea el dataDeLaCita
    expect(req.request.body).toEqual(mockDataCita);

    // Verificar el HEADER
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);

    // Resolver la petición simulando que el backend respondió bien
    req.flush(mockResponse);
  });
});
