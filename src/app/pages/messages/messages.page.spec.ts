import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MessagesPage } from './messages.page';
import { ChatSupabase } from 'src/app/services/chat-supabase';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { of } from 'rxjs';

describe('MessagesPage', () => {
  let component: MessagesPage;
  let fixture: ComponentFixture<MessagesPage>;
  let mockChat: jasmine.SpyObj<ChatSupabase>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNav: jasmine.SpyObj<NavController>;

  const mockConversations = [
    { id: 'conv1', user1: 'userA', user2: 'userB' },
    { id: 'conv2', user1: 'userC', user2: 'userA' }
  ];

  const mockProfiles = [
    { id: 'userB', full_name: 'Usuario B' },
    { id: 'userC', full_name: 'Usuario C' }
  ];

  const mockLastMessages = [
    { body: 'Hola B', created_at: '2025-11-19T10:00:00Z' },
    { body: 'Hola C', created_at: '2025-11-19T09:00:00Z' }
  ];

  beforeEach(async () => {
    mockChat = jasmine.createSpyObj('ChatSupabase', [
      'getUidOrNull',
      'listConversations',
      'profileBasics',
      'lastMessage'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockNav = jasmine.createSpyObj('NavController', ['navigateForward']);

    await TestBed.configureTestingModule({
      imports: [MessagesPage],
      providers: [
        { provide: ChatSupabase, useValue: mockChat },
        { provide: Router, useValue: mockRouter },
        { provide: NavController, useValue: mockNav }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle empty conversations', fakeAsync(async () => {
    mockChat.getUidOrNull.and.returnValue(Promise.resolve('userA'));
    mockChat.listConversations.and.returnValue(Promise.resolve([]));

    await component.load();
    tick();

    expect(component.items.length).toBe(0);
  }));

  it('should open a conversation with navController', () => {
    const convItem = { id: 'conv1', otherUid: 'userB', otherName: 'Usuario B', lastBody: 'Hola' };
    localStorage.setItem('user_role', 'paciente');

    component.open(convItem as any);

    expect(mockNav.navigateForward).toHaveBeenCalledWith(
      ['/tabs', 'chat', 'with', 'userB'],
      jasmine.objectContaining({ state: { from: '/tabs/messages' } })
    );
  });

  it('should call trackByConv correctly', () => {
    const item = { id: 'conv123', otherUid: 'userX', otherName: 'Usuario X', lastBody: 'Hi' };
    expect(component.trackByConv(0, item as any)).toBe('conv123');
  });
});
