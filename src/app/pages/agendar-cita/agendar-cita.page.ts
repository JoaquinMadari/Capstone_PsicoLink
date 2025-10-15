import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from 'src/app/services/appointment';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
IonButton, IonButtons, IonBackButton,IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime,
IonRow, IonCol, IonChip, IonGrid, IonCardSubtitle
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.page.html',
  styleUrls: ['./agendar-cita.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime, IonRow, IonCol,
  IonChip, IonGrid, IonCardSubtitle]
})
export class AgendarCitaPage implements OnInit {
  form = this.fb.group({
    professional: this.fb.control<number | null>(null, Validators.required),
    date: this.fb.control<string | null>(null,  Validators.required),
    time: this.fb.control<string | null>(null,  Validators.required),
    duration: [50, Validators.required]
  });

  professionals: any[] = [];
  appointments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private svc: AppointmentService,
    private toastCtrl: ToastController,
    private route: ActivatedRoute
  ) {}

  STEP_MINUTES = 30;
  DAY_START = '08:00'; // ventana visual
  DAY_END   = '20:00';

  slots: string[] = []; // 'HH:MM:00'
  slotStatus: Record<string, 'free' | 'pro' | 'patient' | 'both'> = {};

  private busyPro: { start: Date; end: Date }[] = [];
  private busyPatient: { start: Date; end: Date }[] = [];

  ngOnInit() {
    this.loadProfessionals();
    this.loadAppointments();

    // Precalcula los slots visuales del día (08:00–20:00 cada 30 min)
    this.slots = this.makeSlots(this.DAY_START, this.DAY_END, this.STEP_MINUTES);

    this.route.queryParams.subscribe(params => {
      const professionalId = params['professionalId'];
      if (professionalId && !isNaN(Number(professionalId))) {
        const c = this.form.get('professional');
        c?.setValue(parseInt(professionalId as string, 10));
        c?.disable();
      } 
      else {
        this.form.get('professional')?.enable();
      }
  });

    this.form.valueChanges.subscribe(v => {
      const prof = this.form.value.professional;
      const dateStr = this.getDatePartISO(this.form.value.date);
      if (prof && dateStr) this.refreshBusy(prof, dateStr);
    });
  }

  // ------------------------------------------
  // INICIO Commit: Mostrar horarios ocupados
  // ------------------------------------------
  formatSlotLabel(s: string): string {
    return s.slice(0,5);
  }

  
  //construir slots de un rango con paso fijo
  makeSlots(startHHMM: string, endHHMM: string, stepMin: number): string[] {
    const res: string[] = [];
    const [sh, sm] = startHHMM.split(':').map(Number);
    const [eh, em] = endHHMM.split(':').map(Number);
    let cur = new Date();
    cur.setHours(sh, sm, 0, 0);
    const end = new Date(cur);
    end.setHours(eh, em, 0, 0);

    while (cur <= end) {
      const hh = String(cur.getHours()).padStart(2, '0');
      const mm = String(cur.getMinutes()).padStart(2, '0');
      res.push(`${hh}:${mm}:00`);
      cur = new Date(cur.getTime() + stepMin * 60000);
    }
    return res;
  }

  //obtiene 'YYYY-MM-DD' de ion-datetime value
  getDatePartISO(val: any): string | null {
    if (!val) return null;
    const iso = String(val);
    //ion-datetime suele dar ISO; asi que obtenemos la parte de fecha
    return iso.split('T')[0] || null;
  }

  //refresca ocupados desde backend y recalcula map de estados
  refreshBusy(professionalId: number, dateISO: string) {
    this.svc.getBusy(professionalId, dateISO).subscribe({
      next: (res) => {
        this.busyPro = res.professional.map(x => ({ start: new Date(x.start), end: new Date(x.end) }));
        this.busyPatient = res.patient.map(x => ({ start: new Date(x.start), end: new Date(x.end) }));
        this.recomputeSlotStatus(dateISO);
      },
      error: err => {
        console.error('busy error', err);
        this.busyPro = []; this.busyPatient = [];
        this.recomputeSlotStatus(dateISO);
      }
    });
  }

  //calcula el estado por slot (30m) para colorear la grilla
  recomputeSlotStatus(dateISO: string) {
    const map: Record<string, 'free'|'pro'|'patient'|'both'> = {};
    for (const s of this.slots) {
      const start = new Date(`${dateISO}T${s}`);
      const end   = new Date(start.getTime() + this.STEP_MINUTES * 60000);

      const hitPro = this.overlapsAny(start, end, this.busyPro);
      const hitPa  = this.overlapsAny(start, end, this.busyPatient);

      map[s] = (hitPro && hitPa) ? 'both' : (hitPro ? 'pro' : (hitPa ? 'patient' : 'free'));
    }
    this.slotStatus = map;
  }

  //deshabilitar inicios que no alcancen por la duración elegida
  isStartDisabled(s: string): boolean {
    const dur = Number(this.form.value.duration) || 0;
    const dateISO = this.getDatePartISO(this.form.value.date);
    if (!dateISO || dur <= 0) return true;

    const start = new Date(`${dateISO}T${s}`);
    const end   = new Date(start.getTime() + dur * 60000);

    //Si el intervalo candidato solapa con algo del profesional o del paciente, no permitido
    return this.overlapsAny(start, end, [...this.busyPro, ...this.busyPatient]);
  }

  //helper de solapamiento
  overlapsAny(aStart: Date, aEnd: Date, intervals: {start: Date; end: Date;}[]): boolean {
    return intervals.some(iv => (aStart < iv.end) && (aEnd > iv.start));
  }

  //click en grilla, setear select de hora
  selectTime(s: string) {
    if (!this.isStartDisabled(s)) {
      this.form.controls['time'].setValue(s);
      this.presentToast(`Seleccionaste ${this.formatSlotLabel(s)}`);
    }
  }

  // ------------------------------------------
  // FIN Commit: Mostrar horarios ocupados
  // ------------------------------------------


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