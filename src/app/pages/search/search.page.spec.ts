import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchPage } from './search.page';
import { SearchService } from '../../services/search';
import { Catalog } from 'src/app/services/catalog';
import { Router } from '@angular/router';
import { ToastController, NavController } from '@ionic/angular';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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

  // ⛑️ Mock correcto de NavController para evitar el subscribe undefined
  const mockNavController = {
    navigateForward: jasmine.createSpy('navigateForward'),
    navigateBack: jasmine.createSpy('navigateBack'),
    navigateRoot: jasmine.createSpy('navigateRoot')
  };

  // ⛑️ Mock de ActivatedRoute (algunos componentes lo usan indirectamente)
  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: jasmine.createSpy().and.returnValue(null)
      }
    }
  };

  beforeEach(async () => {

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'user_role') return 'paciente';
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        FormBuilder,
        { provide: SearchService, useValue: mockSearchService },
        { provide: Catalog, useValue: mockCatalog },
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: NavController, useValue: mockNavController },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
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
































