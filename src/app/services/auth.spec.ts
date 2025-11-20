import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from './auth';
import { environment } from '../../environments/environment';

describe('Auth Service', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Auth]
    });

    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call login API correctly', () => {
    const mockResponse = { access: 'fake-token', refresh: 'fake-refresh' };

    service.login({ email: 'test@example.com', password: '123456' })
      .subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

    const req = httpMock.expectOne(`${environment.API_URL}/login/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: '123456' });

    req.flush(mockResponse);
  });

  afterEach(() => {
    httpMock.verify();
  });
});

