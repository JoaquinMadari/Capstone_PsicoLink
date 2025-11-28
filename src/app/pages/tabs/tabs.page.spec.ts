import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsPage } from './tabs.page';
import { RouterTestingModule } from '@angular/router/testing';

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TabsPage,
        RouterTestingModule   // 👈 Necesario para ActivatedRoute y RouterOutlet
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onTabWillChange should blur active element if possible', () => {
    const mockElement = {
      blur: jasmine.createSpy('blur')
    } as any;

    spyOnProperty(document, 'activeElement', 'get').and.returnValue(mockElement);

    component.onTabWillChange();

    expect(mockElement.blur).toHaveBeenCalled();
  });

  it('onTabWillChange should not throw if no activeElement', () => {
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(null);

    expect(() => component.onTabWillChange()).not.toThrow();
  });
});

