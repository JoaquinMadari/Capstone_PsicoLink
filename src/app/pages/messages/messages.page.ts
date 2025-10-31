import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonRefresher, IonRefresherContent, IonList,
  IonItem, IonLabel, IonNote
} from '@ionic/angular/standalone';
import { ChatSupabase } from 'src/app/services/chat-supabase';
import { Router } from '@angular/router';


type ConvItem = {
  id: string;
  otherUid: string;
  otherName: string;
  lastBody: string;
  lastAt?: string;
};

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, 
    IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonNote]
})
export class MessagesPage implements OnInit {
  me = '';
  items: ConvItem[] = [];
  loading = false;

  constructor(private chat: ChatSupabase, private router: Router) {}

  async ngOnInit() {
    await this.load();
  }

  async load(event?: any) {
    if (this.loading) return;
    this.loading = true;

    try {
      const uid = await this.chat.getUidOrNull();
      if (!uid) {
        this.me = '';
        this.items = [];
        return;
      }

      this.me = uid;

      const convs = await this.chat.listConversations();
      const pairs = convs.map((c: any) => ({
        id: c.id,
        otherUid: c.user1 === this.me ? c.user2 : c.user1,
      }));

      const uniq = Array.from(new Set(pairs.map(p => p.otherUid)));
      const profs = await this.chat.profileBasics(uniq);
      const nameById = new Map(profs.map((p: any) => [p.id, p.full_name || '(Sin nombre)']));

      this.items = [];
      for (const p of pairs) {
        const last = await this.chat.lastMessage(p.id);
        this.items.push({
          id: p.id,
          otherUid: p.otherUid,
          otherName: nameById.get(p.otherUid) || '',
          lastBody: last?.body ?? '—',
          lastAt: last?.created_at
        });
      }
    } catch (err: any) {
      console.warn('Messages load error:', err?.message || err);
      this.items = [];
    } finally {
      this.loading = false;
      if (event?.target) event.target.complete();
    }
  }

  open(item: ConvItem) {
    this.router.navigate(['/chat', item.otherUid]);
  }

  async refresh(ev: any) {
    await this.load(ev);
  }
}
