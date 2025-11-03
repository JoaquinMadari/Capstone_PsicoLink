import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FallidoPage } from './fallido.page';

describe('FallidoPage', () => {
  let component: FallidoPage;
  let fixture: ComponentFixture<FallidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FallidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
