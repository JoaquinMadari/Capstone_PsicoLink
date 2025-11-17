import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleTicketPage } from './detalle-ticket.page';

describe('DetalleTicketPage', () => {
  let component: DetalleTicketPage;
  let fixture: ComponentFixture<DetalleTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
