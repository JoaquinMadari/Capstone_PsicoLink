import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsProPage } from './tabs-pro.page';
import {RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';


describe('TabsProPage', () => {
  let component: TabsProPage;
  let fixture: ComponentFixture<TabsProPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TabsProPage,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { params: of({}), queryParams: of({}) }
        },
        {
          provide: NavController,
          useValue: { navigateForward: () => {}, navigateRoot: () => {} }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TabsProPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRUEBA 1: El componente se crea
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // PRUEBA 2: onTabWillChange blurea el elemento activo
  it('onTabWillChange should blur active element if possible', () => {
    const mockElement = {
      blur: jasmine.createSpy('blur')
    } as any;

    spyOnProperty(document, 'activeElement', 'get').and.returnValue(mockElement);

    component.onTabWillChange();

    expect(mockElement.blur).toHaveBeenCalled();
  });

  // PRUEBA 3: No lanza error si activeElement es null
  it('onTabWillChange should not throw if no activeElement', () => {
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(null);

    expect(() => component.onTabWillChange()).not.toThrow();
  });
});



