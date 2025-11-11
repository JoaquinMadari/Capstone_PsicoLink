import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonLabel, IonToggle, IonBadge,
  IonGrid, IonRow, IonCol, IonList,
  IonFab, IonFabButton } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AppointmentService } from 'src/app/services/appointment';

type Status = 'scheduled' | 'cancelled' | 'completed';

interface UserDetail {
  id: number;
  email: string;
  role: 'paciente' | 'profesional' | 'organizacion' | 'admin';
  first_name?: string;
  last_name?: string;
  full_name?: string | null;
  supabase_uid?: string | null;
}

interface AppointmentDTO {
  id: number;
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  status: Status;
  modality?: 'Presencial' | 'Online' | null;
  reason?: string;
  notes?: string;
  created_at: string;
  // DRF: ids para escritura, detalles para lectura
  patient: number;
  professional: number;
  patient_detail?: UserDetail;
  professional_detail?: UserDetail;
  // Zoom (read-only en respuesta)
  zoom_join_url?: string | null;
  zoom_start_url?: string | null;
  zoom_meeting_id?: string | null;
}

interface Kpis {
  hoursToday: number;
  weekAppointments: number;
  rating: number;
}


@Component({
  selector: 'app-home-pro',
  templateUrl: './home-pro.page.html',
  styleUrls: ['./home-pro.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonLabel, IonToggle, IonBadge,
  IonGrid, IonRow, IonCol, IonList,
  IonFab, IonFabButton, CommonModule, RouterLink]
})
export class HomeProPage implements OnInit {
  private apiUrl = (environment.API_URL || '').replace(/\/$/, '');

  // Estado
  loading = false;
  isAvailable = signal<boolean>(true); // nos falta la logica para que desactive al profesional
  upcoming: AppointmentDTO[] = [];
  pending: AppointmentDTO[] = [];
  kpis: Kpis = { hoursToday: 0, weekAppointments: 0, rating: 0 };

  constructor(
    private svc: AppointmentService,
    private toastCtrl: ToastController,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  // === UI helpers ===
  async presentToast(msg: string) {
    try {
      const t = await this.toastCtrl.create({ message: msg, duration: 2500 });
      await t.present();
    } catch {}
  }

  doRefresh(ev: CustomEvent) {
    this.load(() => (ev.target as HTMLIonRefresherElement).complete());
  }

  onToggleAvailability(ev: CustomEvent) {
    const checked = (ev as any).detail?.checked ?? false;
    this.isAvailable.set(checked);
    this.presentToast(checked ? 'Disponibilidad activada' : 'Disponibilidad pausada');
  }

  goAgenda()   { this.router.navigate(['/pro/mis-citas']); }
  goMessages() { this.router.navigate(['/pro/messages']);  }
  goSupport()  { this.router.navigate(['/soporte']);       }


  detalleLink(a: { professional?: number; professional_detail?: UserDetail; start_datetime: string }) {
    const proId = (typeof a.professional === 'number' && a.professional) ? a.professional : (a.professional_detail?.id ?? null);

    const d = new Date(a.start_datetime);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const hh   = String(d.getHours()).padStart(2, '0');
    const mi   = String(d.getMinutes()).padStart(2, '0');

    const fecha = `${yyyy}-${mm}-${dd}`;
    const hora  = `${hh}:${mi}`;

    return ['/detalle-cita', proId, fecha, hora];
  }

  //Carga de datos
  load(done?: () => void) {
    this.loading = true;

    this.svc.getAppointments().subscribe({
      next: async (res: AppointmentDTO[]) => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

        // Próximas de HOY (max 5)
        const upcoming = (res ?? [])
          .filter(a => a.status === 'scheduled' && new Date(a.start_datetime) >= now)
          .filter(a => a.start_datetime.startsWith(todayStr))
          .slice(0, 5);

        // “Solicitudes nuevas”: creadas en <24h con inicio futuro
        const dayAgo = new Date(Date.now() - 24 * 3600e3);
        const pending = (res ?? [])
          .filter(a => new Date(a.created_at) >= dayAgo && new Date(a.start_datetime) > now);

        // KPIs
        const todayAll = (res ?? [])
          .filter(a => a.status === 'scheduled' && a.start_datetime.startsWith(todayStr));
        const hoursToday = todayAll.reduce((acc, a) => acc + (a.duration_minutes || 0), 0) / 60;

        const weekAppointments = (res ?? []).filter(a => this.isSameWeek(new Date(a.start_datetime), now)).length;

        this.upcoming = upcoming;
        this.pending  = pending;
        this.kpis     = { hoursToday, weekAppointments, rating: 0 };

        this.loading = false;
        done?.();
      },
      error: () => {
        this.loading = false;
        this.presentToast('No se pudo cargar tu inicio');
        done?.();
      }
    });
  }

  private isSameWeek(a: Date, b: Date) {
    const monday = (d: Date) => {
      const dd = new Date(d);
      const day = (dd.getDay() + 6) % 7; // lunes=0
      dd.setHours(0, 0, 0, 0);
      dd.setDate(dd.getDate() - day);
      return dd.getTime();
    };
    return monday(a) === monday(b);
  }
}