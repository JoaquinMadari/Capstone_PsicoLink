import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  const mockAuth = {
    register: jasmine.createSpy('register').and.returnValue(of({})),
    login: jasmine.createSpy('login').and.returnValue(of({}))
  };

  const mockRouter = {
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        FormBuilder,
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.register and auth.login on valid form submission', () => {
    // Rellenar formulario con datos válidos
    component.registerForm.setValue({
      role: 'paciente',
      first_name: 'Juan',
      last_name: 'Perez',
      email: 'juan@example.com',
      password: '123456'
    });

    component.register();

    expect(mockAuth.register).toHaveBeenCalledWith({
      role: 'paciente',
      first_name: 'Juan',
      last_name: 'Perez',
      email: 'juan@example.com',
      password: '123456'
    });
    expect(mockAuth.login).toHaveBeenCalledWith({
      email: 'juan@example.com',
      password: '123456'
    });
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/profile-setup', { replaceUrl: true });
  });
});



