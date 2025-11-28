import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Catalog } from './catalog';

describe('Catalog', () => {
  let service: Catalog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Catalog]
    });
    service = TestBed.inject(Catalog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getSpecialties', () => {
    const spy = spyOn(service, 'getSpecialties').and.callThrough();
    service.getSpecialties();
    expect(spy).toHaveBeenCalled();
  });
});

