import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';

// Mock de ActivatedRoute
const activatedRouteMock = {
  snapshot: {
    paramMap: {
      get: (key: string) => null
    }
  }
};

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RegisterPage,           // standalone component
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock } // mock de ActivatedRoute
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


