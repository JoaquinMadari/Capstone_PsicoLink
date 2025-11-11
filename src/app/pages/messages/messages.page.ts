import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonNote
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { ChatSupabase } from 'src/app/services/chat-supabase';
import { NavController } from '@ionic/angular';


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
  imports: [
    IonContent, RouterModule, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonNote
  ]
})
export class MessagesPage implements OnInit {
  me = '';
  items: ConvItem[] = [];
  loading = false;

  constructor(private chat: ChatSupabase, private router: Router, private nav: NavController) {}

  async ngOnInit() {
    await this.load();
  }

  async load(event?: any) {
    if (this.loading) return;
    this.loading = true;

    try {
      //sesión supabase
      this.me = (await this.chat.getUidOrNull()) || '';
      if (!this.me) {
        this.items = [];
        return;
      }

      //conversaciones del usuario
      const convs = await this.chat.listConversations();
      if (!convs?.length) {
        this.items = [];
        return;
      }

      const pairs = convs.map(c => ({
        id: c.id,
        otherUid: c.user1 === this.me ? c.user2 : c.user1,
      }));

      //nombres en batch (tabla profiles).
      const uniqUids = Array.from(new Set(pairs.map(p => p.otherUid)));
      const profs = await this.chat.profileBasics(uniqUids).catch(() => []);
      const nameById = new Map<string, string>(
        (profs || []).map((p: any) => [p.id, p.full_name || '(Sin nombre)'])
      );

      const lastArr = await Promise.all(pairs.map(p => this.chat.lastMessage(p.id).catch(() => null)));

      //construir lista y ordenar por último mensaje
      const items: ConvItem[] = pairs.map((p, i) => ({
        id: p.id,
        otherUid: p.otherUid,
        otherName: nameById.get(p.otherUid) || p.otherUid.slice(0, 8),
        lastBody: lastArr[i]?.body ?? '—',
        lastAt: lastArr[i]?.created_at
      }));

      this.items = items.sort((a, b) =>
        (new Date(b.lastAt || 0).getTime()) - (new Date(a.lastAt || 0).getTime())
      );

    } catch (err: any) {
      console.warn('Messages load error:', err?.message || err);
      this.items = [];
    } finally {
      this.loading = false;
      if (event?.target) event.target.complete();
    }
  }

  open(m: any) {
    const role = localStorage.getItem('user_role') || localStorage.getItem('role') || 'paciente';
    const base = role === 'profesional' ? '/pro' : '/tabs';

    (document.activeElement as HTMLElement | null)?.blur?.();

    //pasar state.from para que chat sepa a donde volver
    this.nav.navigateForward([base, 'chat', 'with', m.otherUid], {
      animationDirection: 'forward',
      state: { from: `${base}/messages` }
    });
  }

  async refresh(ev: any) {
    await this.load(ev);
  }

  trackByConv = (_: number, it: ConvItem) => it.id;
}
