import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleCitaPage } from './detalle-cita.page';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('DetalleCitaPage', () => {
  let component: DetalleCitaPage;
  let fixture: ComponentFixture<DetalleCitaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleCitaPage, IonicModule.forRoot()],
      providers: [
        // Mock de ActivatedRoute para que la página pueda leer parámetros
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => '1' } } } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleCitaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
