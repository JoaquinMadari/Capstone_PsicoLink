import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfessionalService } from './professional-service';

describe('ProfessionalService', () => {
  let service: ProfessionalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfessionalService]
    });
    service = TestBed.inject(ProfessionalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getProfessionals', () => {
    const spy = spyOn(service, 'getProfessionals').and.callThrough();
    service.getProfessionals();
    expect(spy).toHaveBeenCalled();
  });

  it('should call getProfessionalDetail', () => {
    const spy = spyOn(service, 'getProfessionalDetail').and.callThrough();
    service.getProfessionalDetail(1);
    expect(spy).toHaveBeenCalledWith(1);
  });
});

