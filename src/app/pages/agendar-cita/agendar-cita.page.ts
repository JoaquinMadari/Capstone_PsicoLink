import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from 'src/app/services/auth';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
IonButton, IonButtons, IonBackButton,IonLabel, IonItem, IonList, IonSelectOption
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.page.html',
  styleUrls: ['./agendar-cita.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonSelectOption]
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
    private svc: Auth, //usamos Auth porque contiene createAppointment etc.
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadProfessionals();
    this.loadAppointments();
  }

  async presentToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
    await t.present();
  }

  loadProfessionals() {
    //idealmente tener un endpoint /api/professionals/
    fetch('http://localhost:8000/api/professionals/')
      .then(r => r.json())
      .then(data => { this.professionals = data; })
      .catch(() => { this.professionals = []; });
  }

  loadAppointments() {
    this.svc.getAppointments().subscribe({
      next: (res: any) => {
        this.appointments = res;
      },
      error: (err) => console.error(err)
    });
  }

  onCreate() {
    if (!this.form.valid) return;

    const val = this.form.value;
    const iso = `${val.date}T${val.time}:00Z`; // simplificado

    const payload = {
      professional: val.professional,
      start_datetime: iso,
      duration_minutes: val.duration
    };

    this.svc.createAppointment(payload).subscribe({
      next: () => {
        this.presentToast('Cita agendada');
        this.loadAppointments();
      },
      error: (err) => {
        console.error(err);
        this.presentToast('Error agendando');
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