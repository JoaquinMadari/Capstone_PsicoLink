import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Auth } from './auth'; // o AuthService si ese es el nombre real de la clase

describe('AuthService', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Auth], // explícito y seguro
    });


describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should call login', () => {
    const mockResp = { token: 'fake-token' };
    const spy = spyOn(service, 'login').and.returnValue(of(mockResp)); // <- mockea el retorno
    service.login({ username: 'test@example.com', password: '123456' }).subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should call register', () => {
    const mockResp = { id: 1, username: 'test@example.com' };
    const spy = spyOn(service, 'register').and.returnValue(of(mockResp)); // <- mockea el retorno
    service.register({ username: 'test@example.com', password: '123456' }).subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalled();
  });
});

});

});