import { TestBed } from '@angular/core/testing';
import { MercadoPago } from './mercado-pago'; // Asegúrate que la ruta sea correcta
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
        // 👇 Estos dos providers solucionan el error NG0201 "No provider for HttpClient"
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
    // 1. Arrange (Preparar datos y mocks)
    const mockDataCita = { id: 1, paciente: 'Juan', monto: 5000 };
    const mockResponse = { init_point: 'https://mercadopago.com/checkout/xyz' };
    const fakeToken = 'soy-un-token-falso-123';

    // SIMULAMOS localStorage: Cuando el servicio pida 'access_token', le damos fakeToken
    spyOn(localStorage, 'getItem').and.returnValue(fakeToken);

    // 2. Act (Ejecutar el método)
    service.crearPreferencia(mockDataCita).subscribe(resp => {
      expect(resp).toEqual(mockResponse);
    });

    // 3. Assert (Verificar la petición HTTP "al vuelo")
    // Esperamos una petición a la URL definida en tu environment
    const req = httpMock.expectOne(environment.MP_URL);

    // Verificamos que sea método POST
    expect(req.request.method).toBe('POST');

    // Verificamos que el cuerpo de la petición sea el dataDeLaCita
    expect(req.request.body).toEqual(mockDataCita);

    // 🔍 Verificamos lo más importante: EL HEADER
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);

    // 4. Resolvemos la petición simulando que el backend respondió bien
    req.flush(mockResponse);
  });
});
