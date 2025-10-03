import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment } from 'src/app/services/appointment';
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
    private svc: Appointment, //usamos Auth porque contiene createAppointment etc.
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
    fetch('http://localhost:8000/api/search/')
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

  logFormStatus() {
  console.log("--- ESTADO DE VALIDACIÓN DEL FORMULARIO ---");
  console.log("Formulario General Válido:", this.form.valid);
  
  // Muestra el estado (VALID/INVALID) y el valor de cada campo
  console.log("professional.status:", this.form.get('professional')?.status, "Valor:", this.form.get('professional')?.value);
  console.log("date.status:", this.form.get('date')?.status, "Valor:", this.form.get('date')?.value);
  console.log("time.status:", this.form.get('time')?.status, "Valor:", this.form.get('time')?.value);
  console.log("duration.status:", this.form.get('duration')?.status, "Valor:", this.form.get('duration')?.value);
  console.log("------------------------------------------");
}

  onCreate() {
    if (!this.form.valid) return;

    const val = this.form.value;
    const dateValue = val.date! as string; 
    const timeValue = val.time! as string; 

    const datePart = dateValue.split('T')[0];
    
    let timePart = timeValue;
    timePart = timePart.includes('T') ? timePart.split('T')[1].substring(0, 5) : timePart.substring(0, 5);
    

    const startDatetimeISO = `${datePart}T${timePart}:00Z`;

    const payload = {
        professional: val.professional,
        start_datetime: startDatetimeISO,
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