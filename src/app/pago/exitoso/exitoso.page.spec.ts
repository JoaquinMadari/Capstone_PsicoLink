import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExitosoPage } from './exitoso.page';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ExitosoPage', () => {
  let component: ExitosoPage;
  let fixture: ComponentFixture<ExitosoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ExitosoPage,
        RouterTestingModule  // ← IMPORTANTE: provee Router + ActivatedRoute
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: new Map() },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExitosoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

