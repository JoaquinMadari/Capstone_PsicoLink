import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync, flushMicrotasks } from '@angular/core/testing';
import { ChatPage } from './chat.page';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { ChatSupabase, MessageRow, DirectConversation } from 'src/app/services/chat-supabase';
import { By } from '@angular/platform-browser';

// MOCKS
const fakeOtherUid = 'user-123';
const fakeConversationId = 'conv-456';

const routeMock = {
  snapshot: {
    paramMap: convertToParamMap({ otherUid: fakeOtherUid })
  }
};

const routerMock = {
  navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
  events: { subscribe: jasmine.createSpy('subscribe').and.returnValue({ unsubscribe: () => {} }) }
};

const locationMock = {
  getState: jasmine.createSpy('getState').and.returnValue({ from: '/previous-page' }),
  back: jasmine.createSpy('back')
};

//MOCK SUPABASE
const chatMock: any = {
  currentUserId: jasmine.createSpy('currentUserId').and.resolveTo('me-uid'),

  startDirect: jasmine.createSpy('startDirect').and.resolveTo({
    id: fakeConversationId,
    user1: 'me-uid',
    user2: fakeOtherUid,
    created_at: new Date().toISOString(),
    last_message_at: null
  } as DirectConversation),

  listMessages: jasmine.createSpy('listMessages').and.resolveTo([]),

  profileBasics: jasmine.createSpy('profileBasics')
    .and.resolveTo([{ id: fakeOtherUid, full_name: 'Other User', role: 'paciente' }]),

  //Guarda callback para realtime tests
  subscribeMessages: jasmine.createSpy('subscribeMessages')
    .and.callFake((_convId, callback) => {
      return {
        unsubscribe: jasmine.createSpy('unsubscribe'),
        __callback: callback
      };
    }),

  presence: jasmine.createSpy('presence')
    .and.callFake(async () => ({
      unsubscribe: jasmine.createSpy('unsubscribe'),
      track: jasmine.createSpy('track')
    })),

  //NO devolver mensaje aquí para evitar duplicación
  sendMessage: jasmine.createSpy('sendMessage').and.resolveTo(undefined),

  setTyping: jasmine.createSpy('setTyping').and.resolveTo(),

  unsubscribeAll: jasmine.createSpy('unsubscribeAll')
};

// TEST SUITE
describe('ChatPage', () => {
  let component: ChatPage;
  let fixture: ComponentFixture<ChatPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
        { provide: ChatSupabase, useValue: chatMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatPage);
    component = fixture.componentInstance;

    spyOn(component as any, 'scrollToBottomSoon').and.stub();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // INIT LOAD
  it('ngOnInit should load conversation and messages correctly', fakeAsync(() => {
    const historyMsgs = [{ id: 1, body: 'Hola', sender: fakeOtherUid, created_at: new Date().toISOString() }];
    chatMock.listMessages.and.resolveTo(historyMsgs);

    component.ngOnInit();
    flushMicrotasks();
    tick();

    expect(chatMock.currentUserId).toHaveBeenCalled();
    expect(chatMock.startDirect).toHaveBeenCalledWith(fakeOtherUid);
    expect(component.conversationId).toBe(fakeConversationId);
    expect(chatMock.listMessages).toHaveBeenCalledWith(fakeConversationId);

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].body).toBe('Hola');

    expect(chatMock.subscribeMessages).toHaveBeenCalled();
  }));

  // SEND (OPTIMISTA)
  it('send() should add optimistic message, clear input and call service', fakeAsync(() => {
    component.conversationId = fakeConversationId;
    component.meId = 'me-uid';
    component.input = 'Mensaje Test';

    component.send();
    flushMicrotasks();
    tick();

    expect(component.messages.length).toBe(1);

    const msg = component.messages[0];
    expect(msg.body).toBe('Mensaje Test');
    expect(msg.pending).toBeTrue();
    expect(msg.id).toBeLessThan(0);

    expect(component.input).toBe('');
    expect(chatMock.sendMessage).toHaveBeenCalledWith(fakeConversationId, 'Mensaje Test');
    expect(chatMock.setTyping).toHaveBeenCalledWith(false);
  }));
});



