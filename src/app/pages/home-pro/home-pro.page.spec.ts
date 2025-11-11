import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeProPage } from './home-pro.page';

describe('HomeProPage', () => {
  let component: HomeProPage;
  let fixture: ComponentFixture<HomeProPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeProPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
