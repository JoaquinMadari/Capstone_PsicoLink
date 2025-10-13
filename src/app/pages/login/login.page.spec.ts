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
        // Este es el truco: le decimos a Angular que use un ActivatedRoute "fake"
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
    component.loginForm.setValue({ username: 'test', password: '123456' });
    component.login(); // suponiendo que este es el método que llamas
    expect(authSpy.login).toHaveBeenCalledWith({ username: 'test', password: '123456' });
  });
});






