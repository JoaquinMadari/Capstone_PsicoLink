import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { FormBuilder } from '@angular/forms';
import { Auth } from '../../services/auth';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authSpy: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    // Crear spy de Auth con register y login que devuelvan observables
    authSpy = jasmine.createSpyObj('Auth', ['register', 'login']);
    authSpy.register.and.returnValue(of({}));
    authSpy.login.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        RegisterPage,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        FormBuilder,
        { provide: Auth, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});




