import { SupabaseService } from './supabase';
import { NgZone } from '@angular/core';

describe('SupabaseService', () => {
  let service: SupabaseService;
  let ngZoneSpy: jasmine.SpyObj<NgZone>;

  beforeEach(() => {
    delete (window as any).__sbClient;

    ngZoneSpy = jasmine.createSpyObj('NgZone', ['runOutsideAngular']);
    ngZoneSpy.runOutsideAngular.and.callFake((fn: Function) => fn());

    service = new SupabaseService(ngZoneSpy);
  });

  afterEach(() => {
    delete (window as any).__sbClient;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a new Supabase client if window.__sbClient does not exist', () => {
    expect((window as any).__sbClient).toBeUndefined();

    const client = service.client;

    expect(client).toBeTruthy();
    expect((window as any).__sbClient).toBeDefined();
    expect(ngZoneSpy.runOutsideAngular).toHaveBeenCalled();
  });

  it('should return existing client if called again (singleton)', () => {
    const client1 = service.client;
    ngZoneSpy.runOutsideAngular.calls.reset();

    const client2 = service.client;

    expect(client1).toBe(client2);
    expect(ngZoneSpy.runOutsideAngular).not.toHaveBeenCalled();
  });

  it('should reuse an externally assigned client', () => {
    const fakeClient = { fake: true } as any;
    (window as any).__sbClient = fakeClient;

    const client = service.client;

    expect(client).toBe(fakeClient);
    expect(ngZoneSpy.runOutsideAngular).not.toHaveBeenCalled();
  });
});

