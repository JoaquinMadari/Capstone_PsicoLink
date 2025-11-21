import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SplashPage } from './splash.page';
import { Router } from '@angular/router';

describe('SplashPage', () => {
  let component: SplashPage;
  let fixture: ComponentFixture<SplashPage>;

  // Mock del router
  const mockRouter = {
    navigateByUrl: jasmine.createSpy('navigateByUrl')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplashPage],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SplashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // -------------------------------------------
  // 🧪 PRUEBA 1: El componente se crea
  // -------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------
  // 🧪 PRUEBA 2: Debe redirigir al login después de 3 segundos
  // -------------------------------------------
  it('should navigate to /login after 3 seconds', fakeAsync(() => {
    component.ngOnInit(); 

    // Aún no debería navegar
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();

    // Avanzamos 3 segundos
    tick(3000);

    expect(mockRouter.navigateByUrl).toHaveBeenCalledOnceWith('/login');
  }));
});

