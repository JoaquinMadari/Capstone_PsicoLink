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
    //SERVICIO que maneja la autenticación JWT
    this.svc.getProfessionals().subscribe({
        next: (data) => {
            this.professionals = data; 
        },
        error: (err) => { 
            console.error('Error cargando profesionales:', err);
            this.professionals = []; 
        }
    });
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
    const date = (dateValue ?? '') as string; 
    const time = (timeValue ?? '') as string;

    if (!date || !time) {
      this.presentToast('Por favor selecciona la fecha y hora.');
      return;
    }

    const datePart = date.split('T')[0];
    const timePart = time.split(':').slice(0, 2).join(':');
    const startDatetimeLocal = `${datePart}T${timePart}:00`; 

    const payload = {
        professional,
        start_datetime: startDatetimeLocal, 
        duration_minutes: duration
    };

    this.svc.createAppointment(payload).subscribe({
        next: () => {
            this.presentToast('Cita agendada correctamente');
            this.loadAppointments();
        },
        error: (err) => {
            const errors = err.error || {};
            let msg = 
              errors.start_datetime?.[0] ||
              errors.duration_minutes?.[0] || 
              errors.non_field_errors?.[0] || 
              'Error al agendar la cita. Revise los datos.';

            if (Array.isArray(msg)) {
            msg = msg[0];
            }
                
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