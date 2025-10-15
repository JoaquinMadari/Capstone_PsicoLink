import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
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
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500
    });
    await toast.present();
  }

  loadAppointments() {
    this.loading = true;
    this.svc.getAppointments().subscribe({
      next: (res) => {
        this.appointments = res;
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

}