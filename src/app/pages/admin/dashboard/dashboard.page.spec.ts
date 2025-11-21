import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DashboardPage } from './dashboard.page';
import { Router } from '@angular/router';
import { Auth } from 'src/app/services/auth';
import { RouterTestingModule } from '@angular/router/testing';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let router: Router;
  let authService: jasmine.SpyObj<Auth>;

  beforeEach(waitForAsync(() => {
    const authSpy = jasmine.createSpyObj('Auth', ['logout']);

    TestBed.configureTestingModule({
      imports: [DashboardPage, RouterTestingModule],
      providers: [
        { provide: Auth, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout on authService', async () => {
    authService.logout.and.resolveTo();

    const navigateSpy = spyOn(router, 'navigateByUrl');

    await component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });
});
