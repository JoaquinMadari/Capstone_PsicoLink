import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MisCitasPage } from './mis-citas.page';
import { IonicModule} from '@ionic/angular';
import { AppointmentService } from 'src/app/services/appointment';
import { ToastController } from '@ionic/angular/standalone';

describe('MisCitasPage', () => {
  let component: MisCitasPage;
  let fixture: ComponentFixture<MisCitasPage>;
  let toastCtrlSpy: jasmine.SpyObj<ToastController>;
  let toastMock: { present: jasmine.Spy };

  beforeEach(async () => {
  const presentSpy = jasmine.createSpy('present').and.returnValue(Promise.resolve());

  const toastControllerSpy = {
    create: jasmine.createSpy('create').and.callFake((opts: any) => {
      return Promise.resolve({ present: presentSpy } as unknown as HTMLIonToastElement);
    })
  };

  await TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), MisCitasPage],
    providers: [
      { provide: ToastController, useFactory: () => toastControllerSpy },
      { provide: AppointmentService, useValue: jasmine.createSpyObj('AppointmentService', ['getAppointments', 'updateAppointment']) }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(MisCitasPage);
  component = fixture.componentInstance;

  spyOn(component, 'loadAppointments').and.returnValue();
  fixture.detectChanges();

  toastCtrlSpy = TestBed.inject(ToastController) as any;
});



  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create and present a toast', async () => {
  await component.presentToast('Test message');

  expect(toastCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
    message: 'Test message',
    duration: 2500
  }));

  const toast = await toastCtrlSpy.create.calls.mostRecent().returnValue;
  expect((await toast).present).toHaveBeenCalled();
});

});
































