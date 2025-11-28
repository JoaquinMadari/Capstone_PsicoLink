import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ToastController, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { AppointmentService } from 'src/app/services/appointment';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';

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
    patient: number;
    professional: number;
    patient_detail?: UserDetail;
    professional_detail?: UserDetail;
    zoom_join_url?: string | null;
    zoom_start_url?: string | null;
    zoom_meeting_id?: string | null;
}

@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.page.html',
  styleUrls: ['./mis-citas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class MisCitasPage implements OnInit, OnDestroy {

  appointments: any[] = [];
  loading = false;

  role: Role = 'paciente';
  base = '/tabs';
  backHref = '/tabs/home';

  private routerSub?: Subscription;

  CLOSING_GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutos en milisegundos (Debe coincidir con el backend)


  constructor(
    private svc: AppointmentService,
    private toastCtrl: ToastController,
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit() {
    this.resolveRoleAndBack();
    this.loadAppointments();

    // Evita focus atrapado al navegar hacia atrás / entre outlets
    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
  }

  ngOnDestroy(): void {
    try { this.routerSub?.unsubscribe(); } catch {}
  }

  async presentToast(msg: string, color: 'success' | 'danger' | 'warning' | 'primary' | 'medium' = 'primary') {
    try {
      const toast = await this.toastCtrl.create({
        message: msg,
        duration: 2500,
        color: color
      });
      await toast.present();
    } catch {
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

  onBackClick() {
    // defensa para accesibilidad y evitar focos en páginas ocultas
    (document.activeElement as HTMLElement | null)?.blur?.();
  }


  // Determina si el botón de cierre debe ser visible y habilitado.
  canBeClosed(appointment: AppointmentDTO): boolean {
    // Debe estar agendada
    if (appointment.status !== 'scheduled') {
      return false;
    }
        
    //La hora actual debe ser posterior a la hora de inicio + tiempo de gracia
    const startTime = new Date(appointment.start_datetime).getTime();
    const earliestCloseTime = startTime + this.CLOSING_GRACE_PERIOD_MS;
        
    return Date.now() >= earliestCloseTime;
  }
    
  //Llama al servicio para cerrar la cita.
  onClose(appointment: AppointmentDTO) {
    if (!confirm(`¿Estás seguro de que deseas cerrar la cita con ${appointment.patient_detail?.full_name}?`)) {
      return;
    }

    this.svc.closeAppointment(appointment.id).subscribe({
      next: (res) => {
        //Actualizar la lista (o solo el estado del objeto en la UI)
        this.presentToast('Cita cerrada con éxito.', 'success');
        this.loadAppointments(); // Recargar la lista
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error desconocido al cerrar la cita.';
        this.presentToast(msg, 'danger');
      }
    });
  }

  loadAppointments() {
    this.loading = true;
    this.svc.getAppointments().subscribe({
      next: (res) => {
        // Ordenamos las citas:
        this.appointments = res.sort((a: any, b: any) => {
          const now = new Date().getTime();

          const aStart = new Date(a.start_datetime).getTime();
          const bStart = new Date(b.start_datetime).getTime();

          const aIsPast = a.status === 'cancelled' || aStart < now;
          const bIsPast = b.status === 'cancelled' || bStart < now;

          // Si ambos son futuros o ambos pasados, ordena por fecha ascendente
          if (aIsPast === bIsPast) return aStart - bStart;

          // Los futuros primero, luego los pasados/cancelados
          return aIsPast ? 1 : -1;
        });

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.presentToast('Error al cargar tus citas', 'danger');
      }
    });
  }

  cancel(id: number) {
    this.svc.updateAppointment(id, { status: 'cancelled' }).subscribe({
      next: () => {
        this.presentToast('Cita cancelada', 'success');
        this.loadAppointments();
      },
      error: () => this.presentToast('No se pudo cancelar la cita', 'danger')
    });
  }

  canBeCancelled(appointment: AppointmentDTO): boolean {
    //Debe estar agendada
    if (appointment.status !== 'scheduled') {
        return false;
    }

    //No debe poder cerrarse (es decir, el tiempo no ha pasado)
    return !this.canBeClosed(appointment);
}

  joinMeeting(url: string) {
    if (!url) {
      this.presentToast('Esta cita no tiene un enlace de Zoom disponible.', 'warning');
      return;
    }
    window.open(url, '_blank');
  }

  //Ir a la página de notas del profesional
  irANotas(appointmentId: number) {
  this.router.navigate([`/mis-notas/${appointmentId}`]);
}

  goToNotas(id: any) {
    this.router.navigate(['/mis-notas', id]);
}

  isPastAppointment(appointment: any): boolean {
    const startTime = new Date(appointment.start_datetime).getTime();
    const now = new Date().getTime();
    const durationMs = appointment.duration_minutes * 60 * 1000;
    return now > startTime + durationMs;
  }
}

