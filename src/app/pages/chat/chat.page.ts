import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonFooter, IonInput, IonButtons, IonButton, IonBackButton } from '@ionic/angular/standalone';
import { ChatSupabase, type MessageRow } from 'src/app/services/chat-supabase';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';

type UIMsg = MessageRow & { pending?: boolean; tempId?: number };

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, 
    IonFooter, IonInput, IonButtons, IonButton, IonBackButton]
})

export class ChatPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat   = inject(ChatSupabase);

  conversationId = '';
  otherUserId = '';
  otherName = '';
  meId = '';
  messages: UIMsg[] = [];
  input = '';

  typingUsers: string[] = [];
  backFallback = '/tabs/messages';

  private msgCh?: RealtimeChannel;
  private presCh?: RealtimeChannel;

  async ngOnInit() {
    // back fallback opcional
    const nav = this.router.getCurrentNavigation();
    const from = nav?.extras?.state?.['from'];
    if (typeof from === 'string' && from.length) this.backFallback = from;

    // exige sesión supabase
    try {
      this.meId = await this.chat.currentUserId();
    } catch {
      this.router.navigateByUrl('/login');
      return;
    }

    // rutas: /chat/with/:otherUid   o   /chat/conversation/:conversationId
    const pm = this.route.snapshot.paramMap;
    const convId = pm.get('conversationId');
    const otherUid = pm.get('otherUid');

    if (convId) {
      this.conversationId = convId;
    } else if (otherUid) {
      const conv = await this.chat.startDirect(otherUid);
      this.conversationId = conv.id;
      this.otherUserId = otherUid;
    }

    if (!this.conversationId) {
      this.router.navigateByUrl('/tabs/home');
      return;
    }

    // historial
    const hist = await this.chat.listMessages(this.conversationId);
    this.messages = hist as UIMsg[];
    // si no venía otherUid en la URL, dedúcelo desde el historial
    if (!this.otherUserId) {
      const someoneElse = this.messages.find(m => m.sender !== this.meId);
      this.otherUserId = someoneElse?.sender || '';
    }
    await this.resolveOtherName();
    this.scrollToBottomSoon();

    // realtime: mensajes
    this.msgCh = this.chat.subscribeMessages(this.conversationId, (m) => {
      // deduplicar contra optimista: si hay uno pending con mismo sender/body, lo quitamos
      const idx = this.messages.findIndex(x => x.pending && x.sender === m.sender && x.body === m.body);
      if (idx >= 0) this.messages.splice(idx, 1);
      this.messages = [...this.messages, m as UIMsg];
      this.scrollToBottomSoon();
    });

    // presence: typing
    this.presCh = await this.chat.presence(this.conversationId, (state) => {
      const typingNow: string[] = [];
      for (const [uid, arr] of Object.entries(state)) {
        if (uid === this.meId) continue;
        if ((arr as any[]).some(v => v?.typing === true)) typingNow.push(uid);
      }
      this.typingUsers = typingNow;
    });
  }

  ngOnDestroy(): void {
    try { this.msgCh?.unsubscribe(); } catch {}
    try { this.presCh?.unsubscribe(); } catch {}
    try { this.chat.unsubscribeAll(); } catch {}
  }

  private async resolveOtherName() {
    if (!this.otherUserId) return;
    try {
      const arr = await this.chat.profileBasics([this.otherUserId]);
      this.otherName = arr?.[0]?.full_name || '(Sin nombre)';
    } catch {
      this.otherName = '';
    }
  }

  isMine(m: MessageRow) { return m.sender === this.meId; }

  async onInputChange(v: string) {
    this.input = v ?? '';
    try { await this.chat.setTyping(!!this.input); } catch {}
  }

  async send() {
    const text = this.input.trim();
    if (!text || !this.conversationId) return;

    // UI optimista
    const optimistic: UIMsg = {
      id: -Date.now(), conversation: this.conversationId,
      sender: this.meId, type: 'text', body: text,
      created_at: new Date().toISOString(),
      pending: true, tempId: Date.now()
    };
    this.messages = [...this.messages, optimistic];
    this.input = '';
    this.scrollToBottomSoon();

    try {
      await this.chat.sendMessage(this.conversationId, text);
      await this.chat.setTyping(false);
      // el insert real-time llegará y reemplazará al optimista en subscribeMessages()
    } catch {
      // rollback visual si falla
      this.messages = this.messages.filter(m => m.tempId !== optimistic.tempId);
    }
  }

  private async scrollToBottomSoon() {
    // espera al render
    requestAnimationFrame(() => {
      setTimeout(() => this.content?.scrollToBottom(200), 30);
    });
  }
}