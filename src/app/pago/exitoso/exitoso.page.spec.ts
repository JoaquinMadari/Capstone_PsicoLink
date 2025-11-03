import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExitosoPage } from './exitoso.page';

describe('ExitosoPage', () => {
  let component: ExitosoPage;
  let fixture: ComponentFixture<ExitosoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExitosoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
