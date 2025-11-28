import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileSetupPage } from './profile-setup.page';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Catalog } from 'src/app/services/catalog';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NavController } from '@ionic/angular';

describe('ProfileSetupPage', () => {
  let component: ProfileSetupPage;
  let fixture: ComponentFixture<ProfileSetupPage>;

  const mockHttp = {
    post: jasmine.createSpy('post').and.returnValue(of({}))
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockCatalog = {
    getSpecialties: jasmine.createSpy('getSpecialties').and.returnValue(of([
      { value: 'psicologia', label: 'Psicología' },
      { value: 'otro', label: 'Otro' }
    ]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileSetupPage,
        RouterTestingModule
      ],
      providers: [
        FormBuilder,
        { provide: HttpClient, useValue: mockHttp },
        { provide: Router, useValue: mockRouter },
        { provide: Catalog, useValue: mockCatalog },
        { provide: NavController, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize proForm and paForm', () => {
    expect(component.proForm).toBeDefined();
    expect(component.paForm).toBeDefined();
    expect(component.proForm.controls['rut']).toBeDefined();
    expect(component.paForm.controls['rut']).toBeDefined();
  });

 


});























