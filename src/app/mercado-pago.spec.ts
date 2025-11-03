import { TestBed } from '@angular/core/testing';

import { MercadoPago } from './mercado-pago';

describe('MercadoPago', () => {
  let service: MercadoPago;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MercadoPago);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
