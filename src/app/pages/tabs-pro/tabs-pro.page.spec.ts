import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsProPage } from './tabs-pro.page';

describe('TabsProPage', () => {
  let component: TabsProPage;
  let fixture: ComponentFixture<TabsProPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsProPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
