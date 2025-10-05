import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from 'src/app/services/appointment';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
IonButton, IonButtons, IonBackButton,IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.page.html',
  styleUrls: ['./agendar-cita.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime]
})
export class AgendarCitaPage implements OnInit {
  form = this.fb.group({
    professional: [null, Validators.required],
    date: [null, Validators.required],
    time: [null, Validators.required],
    duration: [50, Validators.required]
  });

  professionals: any[] = [];
  appointments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private svc: AppointmentService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadProfessionals();
    this.loadAppointments();
  }

  async presentToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500 });
    await toast.present();
  }

  loadProfessionals() {
    fetch('http://localhost:8000/api/search/')
      .then(res => res.json())
      .then(data => { this.professionals = data; })
      .catch(() => { this.professionals = []; });
  }

  loadAppointments() {
    this.svc.getAppointments().subscribe({
      next: (res) => { this.appointments = res; },
      error: (err) => console.error(err)
    });
  }

  onCreate() {
    if (!this.form.valid) return;

    const { professional, date: dateValue, time: timeValue, duration } = this.form.value;
    const date = dateValue ?? ''; 
    const time = timeValue ?? '';

    const datePart = (date as string).split('T')[0];
    const timePart = (time as string).includes('T')
      ? (time as string).split('T')[1].substring(0, 5)
      : (time as string).substring(0, 5);

    const startDatetimeISO = `${datePart}T${timePart}:00Z`;

    const payload = {
      professional,
      start_datetime: startDatetimeISO,
      duration_minutes: duration
    };

    this.svc.createAppointment(payload).subscribe({
      next: () => {
        this.presentToast('Cita agendada correctamente');
        this.loadAppointments();
      },
      error: (err) => {
        const msg =
          err.error?.duration_minutes ||
          err.error?.non_field_errors ||
          'Error al agendar la cita. Revise los datos.';
        this.presentToast(msg);
      }
    });
  }

  cancel(id: number) {
    this.svc.updateAppointment(id, { status: 'cancelled' }).subscribe({
      next: () => {
        this.presentToast('Cita cancelada');
        this.loadAppointments();
      },
      error: () => this.presentToast('No se pudo cancelar')
    });
  }
}