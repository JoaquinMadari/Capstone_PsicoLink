import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoportePage } from './soporte.page';
import { SoporteService } from 'src/app/services/soporte';
import { ToastController } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, NavigationStart } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('SoportePage', () => {
  let component: SoportePage;
  let fixture: ComponentFixture<SoportePage>;

  const mockSoporteService = {
    submitTicket: jasmine.createSpy('submitTicket').and.returnValue(of({ ok: true }))
  };

  const mockToastCtrl = {
    create: jasmine.createSpy('create').and.returnValue(
      Promise.resolve({ present: () => {} })
    )
  };

  const mockLocation = {
    getState: () => ({})
  };

  beforeEach(async () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      switch (key) {
        case 'user_full_name': return 'Test User';
        case 'user_email': return 'test@example.com';
        case 'user_role': return 'paciente';
        default: return null;
      }
    });

    await TestBed.configureTestingModule({
      imports: [
        SoportePage,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        FormBuilder,
        { provide: SoporteService, useValue: mockSoporteService },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: Location, useValue: mockLocation },
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

    fixture = TestBed.createComponent(SoportePage);
    component = fixture.componentInstance;

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



