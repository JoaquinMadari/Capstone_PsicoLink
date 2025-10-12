import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SearchPageTestModule } from './search-page-test.module';
import { SearchPage } from './search.page';
import { SearchService } from '../../services/search';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SearchPage', () => {
  let component: SearchPage;
  let fixture: ComponentFixture<SearchPage>;
  let searchService: SearchService;

  const mockResponse = {
    results: [{ id: 1, name: 'Juan Pérez', specialty: 'Psicología' }],
    count: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchPageTestModule,
        HttpClientTestingModule // 👈 añadido
      ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()) // 👈 añadido
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;

    searchService = TestBed.inject(SearchService);
    spyOn(searchService, 'search').and.returnValue(of(mockResponse));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial results', () => {
    component.loadResults();
    expect(searchService.search).toHaveBeenCalled();
    expect(component.profesionales.length).toBe(1);
  });
});






























