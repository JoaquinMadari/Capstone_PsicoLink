import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDetailPage } from './user-detail.page';
import { ActivatedRoute, Router } from '@angular/router';
import { SoporteService } from 'src/app/services/soporte';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { ToastController, NavController, Platform } from '@ionic/angular';
import { Location } from '@angular/common';

describe('UserDetailPage', () => {
  let component: UserDetailPage;
  let fixture: ComponentFixture<UserDetailPage>;

  const mockActivatedRoute = {
    snapshot: { paramMap: { get: () => '1' } }
  };

  const mockSoporteService = {
    getUserDetailForAdmin: jasmine.createSpy('getUserDetailForAdmin').and.returnValue(
      of({
        id: 1,
        email: 'test@example.com',
        role: 'paciente',
        is_active: true,
        date_joined: '2025-01-01',
        last_login: null
      } as any)
    ),
    updateUser: jasmine.createSpy('updateUser').and.returnValue(
      of({
        id: 1,
        email: 'test@example.com',
        role: 'paciente',
        is_active: true
      } as any)
    )
  };

  const mockToastCtrl = {
    create: jasmine.createSpy('create').and.returnValue(
      Promise.resolve({ present: () => {} })
    )
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockNav = jasmine.createSpyObj('NavController', [
    'navigateRoot',
    'navigateForward',
    'navigateBack'
  ]);

  const mockPlatform = {
    ready: () => Promise.resolve()
  };

  const mockLocation = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailPage],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SoporteService, useValue: mockSoporteService },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: Router, useValue: mockRouter },

        // AGREGADO PARA QUE NO FALLE NAVCONTROLLER
        { provide: NavController, useValue: mockNav },
        { provide: Platform, useValue: mockPlatform },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

