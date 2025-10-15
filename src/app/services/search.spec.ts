import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { SearchService } from './search';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchService],
    });
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call search', () => {
    const mockResp = { results: [{ id: 1, name: 'Juan Pérez', specialty: 'Psicología' }] };
    const spy = spyOn(service, 'search').and.returnValue(of(mockResp));
    service.search('psicología').subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalledWith('psicología');
  });
});


