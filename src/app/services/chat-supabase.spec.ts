import { TestBed } from '@angular/core/testing';

import { ChatSupabase } from './chat-supabase';

describe('ChatSupabase', () => {
  let service: ChatSupabase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatSupabase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
