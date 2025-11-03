import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PendientePage } from './pendiente.page';

describe('PendientePage', () => {
  let component: PendientePage;
  let fixture: ComponentFixture<PendientePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PendientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
