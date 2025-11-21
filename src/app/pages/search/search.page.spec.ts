import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchPage } from './search.page';
import { SearchService } from '../../services/search';
import { Catalog } from 'src/app/services/catalog';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, Subject } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('SearchPage', () => {
  let component: SearchPage;
  let fixture: ComponentFixture<SearchPage>;

  // Mocks
  const mockSearchService = {
    search: jasmine.createSpy('search').and.returnValue(of({ results: [], next: null }))
  };

  const mockCatalog = {
    getSpecialties: jasmine.createSpy('getSpecialties').and.returnValue(of([
      { value: 'psicologia', label: 'Psicología' },
      { value: 'fisioterapia', label: 'Fisioterapia' }
    ]))
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockToastCtrl = {
    create: jasmine.createSpy('create').and.returnValue(
      Promise.resolve({ present: () => {} })
    )
  };

  beforeEach(async () => {
    // Mock de localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      switch (key) {
        case 'user_role':
          return 'paciente';
        default:
          return null;
      }
    });

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        FormBuilder,
        { provide: SearchService, useValue: mockSearchService },
        { provide: Catalog, useValue: mockCatalog },
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});































