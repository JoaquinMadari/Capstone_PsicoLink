import { TestBed, ComponentFixture, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { ChatPage } from './chat.page';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ChatSupabase, MessageRow, DirectConversation } from 'src/app/services/chat-supabase';
import { of } from 'rxjs';

// Mock del ActivatedRoute
const fakeOtherUid = 'user-123';
const fakeConversationId = 'conv-456';
const routeMock = {
  snapshot: {
    paramMap: convertToParamMap({ otherUid: fakeOtherUid })
  }
};

// Mock del Router
const routerMock = {
  navigateByUrl: jasmine.createSpy('navigateByUrl')
};

// Mock del ChatSupabase
const chatMock: Partial<ChatSupabase> = {
  currentUserId: jasmine.createSpy('currentUserId').and.resolveTo('me-uid'),
  startDirect: jasmine.createSpy('startDirect').and.resolveTo({
    id: fakeConversationId,
    user1: 'me-uid',
    user2: fakeOtherUid,
    created_at: new Date().toISOString(),
    last_message_at: null
  } as DirectConversation),
  listMessages: jasmine.createSpy('listMessages').and.resolveTo([] as MessageRow[]),
  profileBasics: jasmine.createSpy('profileBasics').and.resolveTo([{ id: fakeOtherUid, full_name: 'Other User', role: 'paciente' }]),
  subscribeMessages: jasmine.createSpy('subscribeMessages').and.returnValue({ unsubscribe: jasmine.createSpy('unsubscribe') }),
  presence: jasmine.createSpy('presence').and.resolveTo({ unsubscribe: jasmine.createSpy('unsubscribe'), track: jasmine.createSpy('track') }),
  setTyping: jasmine.createSpy('setTyping').and.resolveTo()
};

describe('ChatPage', () => {
  let component: ChatPage;
  let fixture: ComponentFixture<ChatPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerMock },
        { provide: ChatSupabase, useValue: chatMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should load conversation and messages', async () => {
    await component.ngOnInit();
    expect(chatMock.currentUserId).toHaveBeenCalled();
    expect(chatMock.startDirect).toHaveBeenCalledWith(fakeOtherUid);
    expect(component.conversationId).toBe(fakeConversationId);
    expect(component.otherUserId).toBe(fakeOtherUid);
    expect(component.otherName).toBe('Other User');
    expect(chatMock.listMessages).toHaveBeenCalledWith(fakeConversationId);
    expect(chatMock.subscribeMessages).toHaveBeenCalledWith(fakeConversationId, jasmine.any(Function));
    expect(chatMock.presence).toHaveBeenCalledWith(fakeConversationId, jasmine.any(Function));
  });

  it('send should add optimistic message and call chat.sendMessage', fakeAsync(async () => {
    await component.ngOnInit();
    component.input = 'Hello';
    spyOn(component, 'scrollToBottomSoon'); // evitamos animaciones
    chatMock.sendMessage = jasmine.createSpy('sendMessage').and.resolveTo({
      id: 1,
      conversation: fakeConversationId,
      sender: 'me-uid',
      type: 'text',
      body: 'Hello',
      created_at: new Date().toISOString()
    });
    await component.send();
    expect(component.messages.some(m => m.body === 'Hello' && m.pending)).toBeTrue();
    expect(chatMock.sendMessage).toHaveBeenCalledWith(fakeConversationId, 'Hello');
  }));

  it('onInputChange should call setTyping', async () => {
    await component.ngOnInit();
    await component.onInputChange('typing...');
    expect(chatMock.setTyping).toHaveBeenCalledWith(true);
    await component.onInputChange('');
    expect(chatMock.setTyping).toHaveBeenCalledWith(false);
  });

  it('handleBack should navigate to home', async () => {
    localStorage.setItem('user_role', 'paciente');
    component.backHref = '/tabs/home';
    component.handleBack();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/tabs/home', { replaceUrl: true });
  });

});


