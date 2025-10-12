import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleCitaPage } from './detalle-cita.page';

describe('DetalleCitaPage', () => {
  let component: DetalleCitaPage;
  let fixture: ComponentFixture<DetalleCitaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleCitaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
