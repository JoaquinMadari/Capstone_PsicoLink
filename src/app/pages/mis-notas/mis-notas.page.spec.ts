import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisNotasPage } from './mis-notas.page';

describe('MisNotasPage', () => {
  let component: MisNotasPage;
  let fixture: ComponentFixture<MisNotasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MisNotasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
