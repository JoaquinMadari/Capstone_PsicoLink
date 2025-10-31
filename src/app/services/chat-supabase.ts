import { Injectable } from '@angular/core';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

export interface DirectConversation { id: string; user1: string; user2: string; created_at: string; last_message_at: string | null; }
export interface MessageRow { id: number; conversation: string; sender: string; type: 'text'|'image'|'file'; body: string; created_at: string; }

type RealtimeSubscribeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED';
type PresenceState = Record<string, Array<Record<string, any>>>;


@Injectable({
  providedIn: 'root'
})
export class ChatSupabase {
  private sb: SupabaseClient;
  private msgChannel?: RealtimeChannel;
  private presenceChannel?: RealtimeChannel;
  private signInInFlight?: Promise<any>;

  constructor(private supa: SupabaseService) {
    this.sb = supa.client;
  }

  // 0) login Supabase
  async signIn(email: string, password: string) {
    if (this.signInInFlight) return this.signInInFlight;
    this.signInInFlight = this.sb.auth.signInWithPassword({ email, password })
      .finally(() => { this.signInInFlight = undefined; });
    const { data, error } = await this.signInInFlight;
    if (error) throw error;
    return data.user;
  }

  async hasSession(): Promise<boolean> {
    const { data } = await this.sb.auth.getSession();
    return !!data.session;
  }

  async getUidOrNull(): Promise<string | null> {
    const { data } = await this.sb.auth.getUser();
    return data.user?.id ?? null;
  }


  async currentUserId(): Promise<string> {
    const uid = await this.getUidOrNull();
    if (!uid) throw new Error('NO_SB_SESSION');
    return uid;
  }

  //crear/obtener conversación 1-1
  async startDirect(otherUserId: string): Promise<DirectConversation> {
    const me = await this.currentUserId();
    const a = me < otherUserId ? me : otherUserId;
    const b = me < otherUserId ? otherUserId : me;

    const { data: found } = await this.sb
      .from('direct_conversation')
      .select('*')
      .or(`and(user1.eq.${a},user2.eq.${b}),and(user1.eq.${b},user2.eq.${a})`)
      .maybeSingle();

    if (found) return found as DirectConversation;

    const { data, error } = await this.sb
      .from('direct_conversation')
      .insert([{ user1: a, user2: b }])
      .select()
      .single();

    if (error) throw error;
    return data as DirectConversation;
  }

  //listar mensajes
  async listMessages(conversationId: string, limit = 50) {
    const { data, error } = await this.sb
      .from('message')
      .select('*')
      .eq('conversation', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data as MessageRow[];
  }

  //enviar texto
  async sendMessage(conversationId: string, body: string) {
    const me = await this.currentUserId();
    const { data, error } = await this.sb
      .from('message')
      .insert([{ conversation: conversationId, sender: me, type: 'text', body }])
      .select()
      .single();
    if (error) throw error;
    return data as MessageRow;
  }

  //realtime: escuchar inserts de message
  subscribeMessages(conversationId: string, onInsert: (m: MessageRow)=>void) {
    this.msgChannel?.unsubscribe();

    this.msgChannel = this.sb
      .channel(`msg:${conversationId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'message', filter: `conversation=eq.${conversationId}` },
          (payload) => onInsert(payload.new as MessageRow))
      .subscribe();
    return this.msgChannel;
  }

  //presence: estado "typing"/online
  async presence(conversationId: string, onSync: (state: PresenceState)=>void) {
    const uid = await this.currentUserId();
    this.presenceChannel?.unsubscribe();

    this.presenceChannel = this.sb.channel(`presence:${conversationId}`, {
      config: { presence: { key: uid } }
    });

    this.presenceChannel.on('presence', { event: 'sync' }, () => {
      onSync(this.presenceChannel!.presenceState() as PresenceState);
    });

    this.presenceChannel.subscribe(async (status: RealtimeSubscribeStatus) => {
      if (status === 'SUBSCRIBED') {
        await this.presenceChannel!.track({ typing: false });
      }
    });

    return this.presenceChannel;
  }

  async setTyping(typing: boolean) {
    if (!this.presenceChannel) return;
    await this.presenceChannel.track({ typing });
  }

  unsubscribeAll() {
    this.msgChannel?.unsubscribe();
    this.presenceChannel?.unsubscribe();
  }



  async listConversations() {
    const me = await this.currentUserId(); //si no hay sesión, lanza NO_SB_SESSION
    const { data, error } = await this.sb
      .from('direct_conversation')
      .select('*')
      .or(`user1.eq.${me},user2.eq.${me}`)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data as DirectConversation[];
  }

  async lastMessage(conversationId: string) {
    const { data, error } = await this.sb
      .from('message')
      .select('*')
      .eq('conversation', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as MessageRow | null;
  }

  async profileBasics(uids: string[]) {
    if (!uids.length) return [];
    const { data, error } = await this.sb
      .from('profiles')
      .select('id, full_name, role')
      .in('id', uids);
    if (error) throw error;
    return data as Array<{id:string;full_name:string|null;role:string}>;
  }


  async supabaseSignOut(): Promise<void> {
    try {
      await this.sb.auth.signOut();
    } finally {
      this.unsubscribeAll();
    }
  }

}
