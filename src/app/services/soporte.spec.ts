import { TestBed } from '@angular/core/testing';

import { Soporte } from './soporte';

describe('Soporte', () => {
  let service: Soporte;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Soporte);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
