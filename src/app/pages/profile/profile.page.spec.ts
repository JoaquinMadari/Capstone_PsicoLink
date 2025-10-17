import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfessionalService } from 'src/app/services/professional-service';
import { Auth } from 'src/app/services/auth';
import { Catalog } from 'src/app/services/catalog';
import { ToastController } from '@ionic/angular';

// ✅ Mock de ProfessionalService
const professionalServiceMock = {
  getProfessionals: jasmine.createSpy('getProfessionals').and.returnValue(of([])),
  getProfessionalDetail: jasmine.createSpy('getProfessionalDetail').and.returnValue(of({}))
};

// ✅ Mock de Auth (si lo inyecta ProfilePage)
const authServiceMock = {
  getCurrentUserRole: () => of('paciente'),
  completeProfile: () => of({ success: true })
};

// ✅ Mock de Catalog (si lo inyecta ProfilePage)
const catalogMock = {
  getSpecialties: jasmine.createSpy('getSpecialties').and.returnValue(of([]))
};

// ✅ Mock de ToastController
const toastControllerMock = {
  create: jasmine.createSpy('create').and.returnValue(
    Promise.resolve({ present: jasmine.createSpy('present') })
  )
};

// ✅ Mock de ActivatedRoute usando snapshot.paramMap
const activatedRouteMock = {
  snapshot: { paramMap: { get: (key: string) => '123' } }
};

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        ProfilePage
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ProfessionalService, useValue: professionalServiceMock },
        { provide: Auth, useValue: authServiceMock },
        { provide: Catalog, useValue: catalogMock },
        { provide: ToastController, useValue: toastControllerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});




