import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleCitaPage } from './detalle-cita.page';
import { ActivatedRoute } from '@angular/router';

describe('DetalleCitaPage', () => {
  let component: DetalleCitaPage;
  let fixture: ComponentFixture<DetalleCitaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalleCitaPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  const params: Record<string, string> = {
                    profesional: 'Dr. Carlos Ruiz',
                    fecha: '15/09/2025',
                    hora: '16:00'
                  };
                  return params[key];
                }
              }
            }
          }
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

  it('should correctly assign route parameters', () => {
    expect(component.profesional).toBe('Dr. Carlos Ruiz');
    expect(component.fecha).toBe('15/09/2025');
    expect(component.hora).toBe('16:00');
  });
});

