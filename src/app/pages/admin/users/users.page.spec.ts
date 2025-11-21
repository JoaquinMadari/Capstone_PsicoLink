import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subscription } from 'rxjs';
import { UsersPage } from './users.page';
import { SoporteService } from 'src/app/services/soporte';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('UsersPage', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;
  let soporteServiceMock: jasmine.SpyObj<SoporteService>;

  const mockUsers = [
    { id: 1, email: 'a@test.com', role: 'paciente', is_active: true, date_joined: '2024-01-01' },
    { id: 2, email: 'b@test.com', role: 'admin', is_active: false, date_joined: '2024-05-01' },
    { id: 3, email: 'c@test.com', role: 'profesional', is_active: true, date_joined: '2023-12-01' }
  ];

  beforeEach(async () => {
    soporteServiceMock = jasmine.createSpyObj('SoporteService', ['getUsersForAdmin']);

    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        { provide: SoporteService, useValue: soporteServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------
  // INICIALIZACIÓN
  // ---------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------
  // CARGA DE USUARIOS CON ÉXITO
  // ---------------------------------------------------------

  it('should load users on init (success case)', () => {
    soporteServiceMock.getUsersForAdmin.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.users.length).toBe(3);
    expect(soporteServiceMock.getUsersForAdmin).toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  // CARGA DE USUARIOS - ERROR
  // ---------------------------------------------------------

  it('should set error when loadUsers fails', () => {
    soporteServiceMock.getUsersForAdmin.and.returnValue(throwError(() => new Error('Fail')));

    component.loadUsers();

    expect(component.error).toBe('No se pudieron cargar la lista de usuarios.');
    expect(component.loading).toBeFalse();
  });

  // ---------------------------------------------------------
  // ORDENAMIENTO DE USUARIOS
  // ---------------------------------------------------------

  it('should sort users: active first, then by date', () => {
    soporteServiceMock.getUsersForAdmin.and.returnValue(of(mockUsers));

    component.loadUsers();

    // Activos primero (id 1 y 3), luego por fecha (más nuevo primero)
    expect(component.users[0].id).toBe(1); // activo, fecha 2024-01-01
    expect(component.users[1].id).toBe(3); // activo, fecha 2023-12-01
    expect(component.users[2].id).toBe(2); // inactivo
  });

  // ---------------------------------------------------------
  // DESTRUCCIÓN (ngOnDestroy)
  // ---------------------------------------------------------

  it('should unsubscribe on destroy', () => {
    soporteServiceMock.getUsersForAdmin.and.returnValue(of(mockUsers));

    component.loadUsers();
    const spy = spyOn(component['sub'] as Subscription, 'unsubscribe');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  // MÉTODOS GETTERS (STATUS)
  // ---------------------------------------------------------

  it('getStatusColor should return correct color', () => {
    expect(component.getStatusColor(true)).toBe('success');
    expect(component.getStatusColor(false)).toBe('danger');
  });

  it('getStatusIcon should return correct icon', () => {
    expect(component.getStatusIcon(true)).toBe('person-circle-outline');
    expect(component.getStatusIcon(false)).toBe('person-remove-outline');
  });
});
