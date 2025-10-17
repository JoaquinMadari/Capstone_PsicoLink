import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { Auth } from '../../services/auth';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authSpy: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('Auth', ['login', 'logout']);
    authSpy.login.and.returnValue(of({ access: 'fake-token', refresh: 'fake-refresh' }));

    await TestBed.configureTestingModule({
      imports: [
        LoginPage,              // Standalone component
        HttpClientTestingModule,
        IonicModule.forRoot()
      ],
      providers: [
        { provide: Auth, useValue: authSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => null } },
            params: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should login successfully using form', () => {
  // patchValue asegura que no da error si agregas más campos en el formGroup
  component.loginForm.patchValue({ 
    email: 'test@example.com', 
    password: '123456' 
  });

  component.login();

  // Auth.login espera {username, password}, LoginPage hace el mapping
  expect(authSpy.login).toHaveBeenCalledWith({ username: 'test@example.com', password: '123456' });
}); 
});







