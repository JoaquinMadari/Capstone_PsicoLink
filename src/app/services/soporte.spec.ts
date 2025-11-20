import { TestBed } from '@angular/core/testing';
import { SoporteService } from './soporte';

describe('SoporteService', () => {
  let service: SoporteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SoporteService]
    });
    service = TestBed.inject(SoporteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
