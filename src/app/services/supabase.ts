import { Injectable, NgZone } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

declare global {
  interface Window { __sbClient?: SupabaseClient }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private _client!: SupabaseClient;

   constructor(private ngZone: NgZone) {}

  get client(): SupabaseClient {
    if (!window.__sbClient) {
      this.ngZone.runOutsideAngular(() => {
        window.__sbClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storage: window.localStorage,
            lock: async (_name, _timeout, fn) => await fn(),
          },
        });
      });
    }
    this._client = window.__sbClient!;
    return this._client;
  }
}