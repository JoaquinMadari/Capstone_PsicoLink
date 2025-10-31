import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonFooter, IonInput, IonButtons, IonButton } from '@ionic/angular/standalone';
import { ChatSupabase, type MessageRow } from 'src/app/services/chat-supabase';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonFooter, IonInput, IonButtons, IonButton]
})
export class ChatPage implements OnInit {
  conversationId = '';
  otherUserId = '';
  meId = '';
  messages: MessageRow[] = [];
  input = '';
  typingUsers: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chat: ChatSupabase) {}

  async ngOnInit() {
    this.meId = await this.chat.currentUserId();

    const params = this.route.snapshot.paramMap;

    // A) Entrar con otherUid (crea/recupera la conversación)
    const otherUid = params.get('otherUid');
    if (otherUid) {
      const conv = await this.chat.startDirect(otherUid);
      this.conversationId = conv.id;
    }

    // B) Entrar con conversationId (abrir existente)
    const convId = params.get('conversationId');
    if (convId) {
      this.conversationId = convId;
    }

    if (!this.conversationId) {
      this.router.navigateByUrl('/tabs/home');
      return;
    }

    //mensajes históricos
    this.messages = await this.chat.listMessages(this.conversationId);

    //realtime nuevos mensajes
    this.chat.subscribeMessages(this.conversationId, (m) => {
      this.messages = [...this.messages, m];
    });

    //presencia/typing
    this.chat.presence(this.conversationId, (state) => {
      this.typingUsers = Object.entries(state)
        .filter(([uid, arr]) => uid !== this.meId && (arr as any[]).some(v => v.typing === true))
        .map(([uid]) => uid as string);
    });
  }

  ngOnDestroy(): void {
    this.chat.unsubscribeAll();
  }

  async send() {
    const text = this.input.trim();
    if (!text) return;
    await this.chat.sendMessage(this.conversationId, text);
    this.input = '';
    await this.chat.setTyping(false);
  }

  async onInputChange(v: string) {
    this.input = v;
    await this.chat.setTyping(!!this.input);
  }

  isMine(m: MessageRow) { return m.sender === this.meId; }
}