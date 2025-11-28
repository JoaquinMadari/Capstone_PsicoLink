import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // ✅ Forma moderna de proveer rutas
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // 1. IMPORTANTE: Al ser 'standalone: true', el componente se pone en 'imports'
      // NO en 'declarations'.
      imports: [AppComponent],
      
      // 2. Proveedores necesarios
      providers: [
        provideRouter([]) // Simulamos rutas vacías para que no falle el <ion-router-outlet>
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Verificamos que la instancia se cree correctamente
    expect(app).toBeTruthy();
  });

  // Opcional: Verificar que Ionic se está renderizando (ion-app suele ser el tag raíz)
  it('should have <ion-app> as the root element structure', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Buscamos si existe alguna etiqueta de Ionic o el router outlet
    // Dependiendo de tu HTML, esto podría ser 'ion-app', 'ion-router-outlet' o 'ion-content'
    expect(compiled.querySelector('ion-router-outlet')).toBeTruthy();
  });
});
