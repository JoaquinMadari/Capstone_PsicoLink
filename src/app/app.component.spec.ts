import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      
      providers: [
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Verificar que la instancia se cree correctamente
    expect(app).toBeTruthy();
  });

  // Verificar que Ionic se está renderizando
  it('should have <ion-app> as the root element structure', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Se busca revisar si existe alguna etiqueta de Ionic o el router outlet
    expect(compiled.querySelector('ion-router-outlet')).toBeTruthy();
  });
});
