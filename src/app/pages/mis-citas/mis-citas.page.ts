import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ToastController,
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
} from '@ionic/angular/standalone';
import { AppointmentService } from 'src/app/services/appointment';

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
export class MisCitasPage implements OnInit {

  appointments: any[] = [];
  loading = false;

  constructor(
    private svc: AppointmentService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  async presentToast(msg: string) {
    try {
      const toast = await this.toastCtrl.create({
        message: msg,
        duration: 2500
      });
      await toast.present();
    } catch {
      // en test o si el injector está destruido, simplemente ignoramos
    }
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
        this.presentToast('Error al cargar tus citas');
      }
    });
  }

  cancel(id: number) {
    this.svc.updateAppointment(id, { status: 'cancelled' }).subscribe({
      next: () => {
        this.presentToast('Cita cancelada');
        this.loadAppointments();
      },
      error: () => this.presentToast('No se pudo cancelar la cita')
    });
  }

  joinMeeting(url: string) {
    if (!url) {
      this.presentToast('Esta cita no tiene un enlace de Zoom disponible.');
      return;
    }
    window.open(url, '_blank');
  }

  isPastAppointment(appointment: any): boolean {
    const startTime = new Date(appointment.start_datetime).getTime();
    const now = new Date().getTime();
    const durationMs = appointment.duration_minutes * 60 * 1000;
    return now > startTime + durationMs;
  }
}

