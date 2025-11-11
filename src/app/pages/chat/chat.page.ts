import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonFooter,
  IonInput, IonButtons, IonButton, IonIcon} from '@ionic/angular/standalone';
import { ChatSupabase, type MessageRow } from 'src/app/services/chat-supabase';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { chevronBack } from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({ chevronBack });

type UIMsg = MessageRow & { pending?: boolean; tempId?: number };
type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonFooter, IonInput, IonButtons, IonButton, IonIcon
  ]
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat   = inject(ChatSupabase);

  constructor(
    private location: Location
  ) {}

  role: Role = 'paciente';
  base = '/tabs';
  backHref = '/tabs/home';

  conversationId = '';
  otherUserId = '';
  otherName = '';
  meId = '';
  messages: UIMsg[] = [];
  input = '';

  typingUsers: string[] = [];

  private msgCh?: RealtimeChannel;
  private presCh?: RealtimeChannel;
  private routerSub?: Subscription;

  async ngOnInit() {
    this.resolveRoleAndBack();

    // Evita focus atrapado al navegar hacia atrás / entre outlets
    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });

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
      this.router.navigateByUrl(`${this.base}/home`);
      return;
    }

    // historial
    const hist = await this.chat.listMessages(this.conversationId);
    this.messages = hist as UIMsg[];

    // deducir otherUser si no venía
    if (!this.otherUserId) {
      const someoneElse = this.messages.find(m => m.sender !== this.meId);
      this.otherUserId = someoneElse?.sender || '';
    }
    await this.resolveOtherName();
    this.scrollToBottomSoon();

    // realtime: mensajes
    this.msgCh = this.chat.subscribeMessages(this.conversationId, (m) => {
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
    try { this.chat.setTyping(false); } catch {} // <- opcional: apaga typing
    try { this.routerSub?.unsubscribe(); } catch {}
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

    const optimistic: UIMsg = {
      id: -Date.now(),
      conversation: this.conversationId,
      sender: this.meId,
      type: 'text',
      body: text,
      created_at: new Date().toISOString(),
      pending: true,
      tempId: Date.now()
    };
    this.messages = [...this.messages, optimistic];
    this.input = '';
    this.scrollToBottomSoon();

    try {
      await this.chat.sendMessage(this.conversationId, text);
      await this.chat.setTyping(false);
    } catch {
      this.messages = this.messages.filter(m => m.tempId !== optimistic.tempId);
    }
  }

  // Detecta rol y construye el home correcto (/tabs/home o /pro/home)
  private resolveRoleAndBack() {
    const r = (localStorage.getItem('user_role') || localStorage.getItem('role') || 'paciente') as Role;
    this.role = r;
    this.base = r === 'profesional' ? '/pro' : '/tabs';
    this.backHref = `${this.base}/home`;

    //leer 'from' desde el history state
    const st = this.location.getState() as { from?: string };
    const from = (typeof st?.from === 'string' && st.from.length) ? st.from : null;
    if (from) this.backHref = from;
  }

  handleBack() {
    (document.activeElement as HTMLElement | null)?.blur?.();

    const st = this.location.getState() as any;
    const explicit = st?.from ?? this.backHref ?? null;

    const role = (localStorage.getItem('user_role') || localStorage.getItem('role') || 'paciente') as Role;
    const safeBase = role === 'profesional' ? '/pro' : '/tabs';

    if (explicit && typeof explicit === 'string') {
      // permitir '/search' (top-level) o rutas dentro del base (/tabs or /pro)
      if (explicit === '/search' || explicit.startsWith(safeBase)) {
        this.router.navigateByUrl(explicit, { replaceUrl: true }).catch(() => {
          this.router.navigateByUrl(`${safeBase}/home`, { replaceUrl: true });
        });
        return;
      }
      this.router.navigateByUrl(`${safeBase}/home`, { replaceUrl: true }).catch(() => {
        this.router.navigateByUrl('/splash', { replaceUrl: true });
      });
      return;
    }

    // si no hay explicit, navegar a home del rol
    this.router.navigateByUrl(`${safeBase}/home`, { replaceUrl: true }).catch(() => {
      this.router.navigateByUrl('/splash', { replaceUrl: true });
    });
  }



  private scrollToBottomSoon() {
    requestAnimationFrame(() => {
      setTimeout(() => this.content?.scrollToBottom(200), 30);
    });
  }
}
