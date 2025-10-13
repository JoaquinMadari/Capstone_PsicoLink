import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendarCitaPage } from './agendar-cita.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AgendarCitaPage', () => {
  let component: AgendarCitaPage;
  let fixture: ComponentFixture<AgendarCitaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgendarCitaPage,        // standalone component
        HttpClientTestingModule // para los servicios que usan HttpClient
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarCitaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

