import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { RouterTestingModule } from '@angular/router/testing';
import { Auth } from 'src/app/services/auth';
import { of } from 'rxjs';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let authSpy: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('Auth', ['logout']);
    authSpy.logout.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [
        HomePage,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: Auth, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;

    // Inicializa arrays usados en template si los hubiera
    // component.pages = [{ title: 'Login', root: '/login' }]; // solo si tu template usa p.root

    fixture.detectChanges(); // dispara ngOnInit()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



