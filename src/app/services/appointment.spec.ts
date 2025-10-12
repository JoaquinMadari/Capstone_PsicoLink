import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AppointmentService } from './appointment';

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService],
    });
    service = TestBed.inject(AppointmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call createAppointment', () => {
    const mockResp = { id: 1, date: '2025-10-10' };
    const spy = spyOn(service, 'createAppointment').and.returnValue(of(mockResp));
    service.createAppointment({ date: '2025-10-10' }).subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should call getAppointments', () => {
    const mockResp = [{ id: 1, date: '2025-10-10' }];
    const spy = spyOn(service, 'getAppointments').and.returnValue(of(mockResp));
    service.getAppointments().subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should call getAppointment', () => {
    const mockResp = { id: 1, date: '2025-10-10' };
    const spy = spyOn(service, 'getAppointment').and.returnValue(of(mockResp));
    service.getAppointment(1).subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should call updateAppointment', () => {
    const mockResp = { id: 1, date: '2025-10-11' };
    const spy = spyOn(service, 'updateAppointment').and.returnValue(of(mockResp));
    service.updateAppointment(1, { date: '2025-10-11' }).subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalledWith(1, { date: '2025-10-11' });
  });

  it('should call deleteAppointment', () => {
    const mockResp = { success: true };
    const spy = spyOn(service, 'deleteAppointment').and.returnValue(of(mockResp));
    service.deleteAppointment(1).subscribe(res => {
      expect(res).toEqual(mockResp);
    });
    expect(spy).toHaveBeenCalledWith(1);
  });
});


