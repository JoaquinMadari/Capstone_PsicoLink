import { TestBed } from '@angular/core/testing';
import { ChatSupabase } from './chat-supabase';
import { SupabaseService } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Ayuda a crear un objeto que simula la cadena infinita de Supabase (.from.select.eq...)
const createSupabaseMock = () => {
  // Mock de Auth
  const authSpy = {
    signInWithPassword: jasmine.createSpy('signInWithPassword').and.resolveTo({ data: { user: { id: 'user-123' } }, error: null }),
    setSession: jasmine.createSpy('setSession').and.resolveTo({ error: null }),
    getSession: jasmine.createSpy('getSession').and.resolveTo({ data: { session: { access_token: 'abc' } }, error: null }),
    getUser: jasmine.createSpy('getUser').and.resolveTo({ data: { user: { id: 'me-uid' } }, error: null }),
    signOut: jasmine.createSpy('signOut').and.resolveTo({ error: null })
  };

  // Mock de Base de Datos (Query Builder)
  // Devuelve 'this' para permitir encadenamiento: .select().eq().order()...
  const dbBuilder: any = {
    select: jasmine.createSpy('select').and.returnValue(null), // Se reasigna abajo
    insert: jasmine.createSpy('insert').and.returnValue(null),
    eq: jasmine.createSpy('eq').and.returnValue(null),
    or: jasmine.createSpy('or').and.returnValue(null),
    in: jasmine.createSpy('in').and.returnValue(null),
    order: jasmine.createSpy('order').and.returnValue(null),
    limit: jasmine.createSpy('limit').and.returnValue(null),
    single: jasmine.createSpy('single').and.resolveTo({ data: {}, error: null }),
    maybeSingle: jasmine.createSpy('maybeSingle').and.resolveTo({ data: null, error: null })
  };
  
  // métodos encadenables se devuelvan a sí mismos
  dbBuilder.select.and.returnValue(dbBuilder);
  dbBuilder.insert.and.returnValue(dbBuilder);
  dbBuilder.eq.and.returnValue(dbBuilder);
  dbBuilder.or.and.returnValue(dbBuilder);
  dbBuilder.in.and.returnValue(dbBuilder);
  dbBuilder.order.and.returnValue(dbBuilder);
  dbBuilder.limit.and.returnValue(dbBuilder);

  // Mock de Realtime
  const channelSpy = {
    on: jasmine.createSpy('on').and.returnValue(null),
    subscribe: jasmine.createSpy('subscribe').and.callFake((fn: any) => {
      if(fn) fn('SUBSCRIBED'); // Simular conexión inmediata
      return channelSpy; 
    }),
    unsubscribe: jasmine.createSpy('unsubscribe').and.returnValue(true),
    track: jasmine.createSpy('track').and.resolveTo('ok'),
    presenceState: jasmine.createSpy('presenceState').and.returnValue({})
  };
  channelSpy.on.and.returnValue(channelSpy);

  // El Cliente Principal
  const clientSpy: any = {
    auth: authSpy,
    from: jasmine.createSpy('from').and.returnValue(dbBuilder),
    channel: jasmine.createSpy('channel').and.returnValue(channelSpy)
  };

  return { clientSpy, dbBuilder, channelSpy, authSpy };
};


describe('ChatSupabase Service', () => {
  let service: ChatSupabase;
  let supabaseServiceMock: any;
  let mocks: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    mocks = createSupabaseMock();

    // Mock del Wrapper SupabaseService que se inyecta en el constructor
    supabaseServiceMock = {
      client: mocks.clientSpy
    };

    TestBed.configureTestingModule({
      providers: [
        ChatSupabase,
        { provide: SupabaseService, useValue: supabaseServiceMock }
      ]
    });

    service = TestBed.inject(ChatSupabase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- PRUEBAS DE AUTH ---

  it('currentUserId should return the user ID from auth.getUser', async () => {
    const uid = await service.currentUserId();
    expect(mocks.authSpy.getUser).toHaveBeenCalled();
    expect(uid).toBe('me-uid');
  });

  it('signIn should call auth.signInWithPassword', async () => {
    const user = await service.signIn('test@test.com', '123456');
    expect(mocks.authSpy.signInWithPassword).toHaveBeenCalledWith({ email: 'test@test.com', password: '123456' });
    expect(user.id).toBe('user-123');
  });

  // --- PRUEBAS DE MENSAJES ---

  it('sendMessage should insert a message', async () => {
    const mockMsg = { id: 100, body: 'Hola' };
    mocks.dbBuilder.single.and.resolveTo({ data: mockMsg, error: null });

    const res = await service.sendMessage('conv-1', 'Hola');

    expect(mocks.clientSpy.from).toHaveBeenCalledWith('message');
    expect(mocks.dbBuilder.insert).toHaveBeenCalledWith(jasmine.arrayContaining([
      jasmine.objectContaining({ conversation: 'conv-1', body: 'Hola', sender: 'me-uid' })
    ]));
    expect(res).toEqual(mockMsg as any);
  });

  it('listMessages should select from message table', async () => {
    const mockList = [{ id: 1 }, { id: 2 }];
    // Se simula comportamiento de promesa directa para .limit() ya que devuelve data
    mocks.dbBuilder.limit.and.resolveTo({ data: mockList, error: null });

    const res = await service.listMessages('conv-1');

    expect(mocks.clientSpy.from).toHaveBeenCalledWith('message');
    expect(mocks.dbBuilder.eq).toHaveBeenCalledWith('conversation', 'conv-1');
    expect(mocks.dbBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(res).toEqual(mockList as any);
  });

  // --- PRUEBAS DE REALTIME ---

  it('subscribeMessages should setup channel and listener', () => {
    const onInsertSpy = jasmine.createSpy('onInsert');
    
    service.subscribeMessages('conv-1', onInsertSpy);

    expect(mocks.clientSpy.channel).toHaveBeenCalledWith('msg:conv-1');
    expect(mocks.channelSpy.on).toHaveBeenCalledWith(
      'postgres_changes',
      jasmine.objectContaining({ event: 'INSERT', table: 'message' }),
      jasmine.any(Function)
    );
    expect(mocks.channelSpy.subscribe).toHaveBeenCalled();
  });

  it('setTyping should call track on presence channel', async () => {
    // Primero se inicializa el canal de presencia
    await service.presence('conv-1', () => {});
    
    await service.setTyping(true);

    expect(mocks.channelSpy.track).toHaveBeenCalledWith({ typing: true });
  });

  it('profileBasics should return empty array if empty input', async () => {
    const res = await service.profileBasics([]);
    expect(res).toEqual([]);
    expect(mocks.clientSpy.from).not.toHaveBeenCalled();
  });

});
