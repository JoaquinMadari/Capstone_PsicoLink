import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from 'src/app/services/appointment';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MercadoPago as MercadopagoService } from 'src/app/services/mercado-pago';

// 💡 ¡CORRECCIÓN IMPORTANTE! (Para el error t.setFocus)
// Todos los controladores y componentes de Ionic deben importarse
// desde '@ionic/angular/standalone' en un componente standalone.
import {
    ToastController,
    AlertController,
    LoadingController,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonLabel,
    IonItem,
    IonList,
    IonSelectOption,
    IonSelect,
    IonInput,
    IonDatetime,
    IonRow,
    IonCol,
    IonChip,
    IonGrid,
    IonCardSubtitle,
    IonText
} from '@ionic/angular/standalone';

// Define la estructura mínima de una cita ocupada del backend
interface BusySlot {
    id: number;
    start: string;
    end: string;
    // Agregamos professional_id para el filtro

}

// Define el tipo de la respuesta del servicio (debe coincidir con tu servicio)
interface BusyResponse {
    professional: BusySlot[];
    patient: BusySlot[];
}

@Component({
    selector: 'app-agendar-cita',
    templateUrl: './agendar-cita.page.html',
    styleUrls: ['./agendar-cita.page.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
        IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime,
        IonRow, IonCol, IonChip, IonGrid, IonCardSubtitle,IonText
    ]
})
export class AgendarCitaPage implements OnInit {
    
    // 👈🏼 1. DECLARACIÓN DE LA PROPIEDAD
    minDate: string; 

     constructor(
    private fb: FormBuilder, private svc: AppointmentService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private mpService: MercadopagoService,
        private loadingCtrl: LoadingController 
 ) {
        // 👈🏼 2. INICIALIZACIÓN EN EL CONSTRUCTOR
        const today = new Date();
        // Genera la fecha actual en formato ISO 8601 (YYYY-MM-DD), requerido por [min]
        this.minDate = today.toISOString().split('T')[0];
    }

    // --------- Form ----------
    form = this.fb.group({
        professional: this.fb.control<number | null>(null, Validators.required),
        date: this.fb.control<string | null>(null, Validators.required),
        time: this.fb.control<string | null>(null, Validators.required),
        duration: this.fb.control<number | null>(50, Validators.required),
        modality: this.fb.control<string | null>(null, Validators.required),
        reason: this.fb.control<string | null>(null, [Validators.maxLength(255)])
    });

    professionals: any[] = [];
    private _allAppointments: any[] = []; // Nueva propiedad privada para todas las citas
    busyTimes: string[] = [];

    get selectedProfessional() {
        const id = this.form.get('professional')!.value;
        return this.professionals.find(p => p.id === id);
    }

    get appointments(): any[] {
        const now = new Date();
        
        return this._allAppointments.filter(a => {
            // 1. Filtrar por estado 'scheduled'
            const isScheduled = a.status === 'scheduled';
            
            // 2. Filtrar por fecha futura (o la de hoy)
            const appointmentDate = new Date(a.start_datetime);
            
            // Compara solo el día (ignora la hora) para incluir citas de hoy
            const appDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
            const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // La cita debe ser hoy o en el futuro
            const isFutureOrToday = appDateOnly >= todayDateOnly;

            return isScheduled && isFutureOrToday;
        });
    }


    // --------- Slots / disponibilidad ----------
    STEP_MINUTES = 30;
    DAY_START = '08:00';
    DAY_END = '20:00';

    slots: string[] = []; // 'HH:MM:00'
    slotStatus: Record<string, 'free' | 'pro' | 'patient' | 'both'> = {};
    private busyPro: { start: Date; end: Date }[] = [];
    private busyPatient: { start: Date; end: Date }[] = [];

    get proId(): number | null {
        return this.form.get('professional')?.value ?? null;
    }

    get hasProAndDate(): boolean {
        return !!(this.proId && this.form.get('date')?.value);
    }

    ngOnInit() {
        this.loadProfessionals();
        this.loadAppointments();

        this.slots = this.makeSlots(this.DAY_START, this.DAY_END, this.STEP_MINUTES);

        this.route.queryParams.subscribe(params => {
            const professionalId = params['professionalId'];
            const c = this.form.get('professional');
            if (professionalId && !isNaN(Number(professionalId))) {
                c?.setValue(parseInt(professionalId as string, 10));
                c?.disable();
            } else {
                c?.enable();
            }
        });

        this.form.get('professional')!.valueChanges.subscribe(() => {
            this.configureModalityValidators();
            const prof = this.form.get('professional')!.value;
            const dateStr = this.getDatePartISO(this.form.get('date')!.value);
            if (prof && dateStr) this.refreshBusy(prof, dateStr);
        });

        this.form.get('date')!.valueChanges.subscribe(v => {
            const prof = this.form.get('professional')!.value;
            const dateStr = this.getDatePartISO(v);
            if (prof && dateStr) this.refreshBusy(prof, dateStr);
        });

        this.form.valueChanges.subscribe(() => {
            const dateStr = this.getDatePartISO(this.form.get('date')!.value);
            if (dateStr) this.recomputeSlotStatus(dateStr);
        });
    }

    private configureModalityValidators() {
        const prof = this.selectedProfessional;
        const mCtrl = this.form.get('modality')!;

        mCtrl.setValue(null, { emitEvent: false });
        mCtrl.setValidators(null);
        mCtrl.updateValueAndValidity({ emitEvent: false });

        if (!prof || !prof.work_modality) {
            mCtrl.disable({ emitEvent: false });
            return;
        }

        if (prof.work_modality === 'Mixta') {
            mCtrl.enable({ emitEvent: false });
            mCtrl.setValidators([Validators.required]);
            mCtrl.updateValueAndValidity({ emitEvent: false });
        } else if (prof.work_modality === 'Presencial' || prof.work_modality === 'Online') {
            mCtrl.setValue(prof.work_modality, { emitEvent: false });
            mCtrl.disable({ emitEvent: false });
        } else {
            mCtrl.disable({ emitEvent: false });
        }
    }

    async presentToast(msg: string) {
        const toast = await this.toastCtrl.create({ message: msg, duration: 2500, position: 'top' });
        await toast.present();
    }

    loadProfessionals() {
        this.svc.getProfessionals().subscribe({
            next: (res: any) => {
                const rows = res?.results ?? res ?? [];
                this.professionals = rows;
                this.configureModalityValidators();
            },
            error: () => { this.professionals = []; }
        });
    }

    loadAppointments() {
        this.svc.getAppointments().subscribe({
            next: res => this._allAppointments = res, // 🎯 asigna a la propiedad privada
            error: err => console.error(err)
        });
        }


    // 💰 FUNCIÓN CENTRAL: Llama a Mercado Pago.
    async iniciarPago() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            this.presentToast('Completa los campos requeridos');
            return;
        }

        const { professional, date: dateValue, time: timeValue, duration, modality, reason } = this.form.getRawValue();

        if (!professional) {
            this.presentToast('Debes seleccionar un profesional.');
            return;
        }

        const date = (dateValue ?? '') as string;
        const time = (timeValue ?? '') as string;
        if (!date || !time) {
            this.presentToast('Por favor selecciona la fecha y hora desde la grilla de disponibilidad.');
            return;
        }

        const datePart = date.split('T')[0];
        const timePart = time.split(':').slice(0, 2).join(':');
        // Formato ISO 8601 (YYYY-MM-DDTHH:MM:SS) esperado por el backend
        const startDatetimeBackend = `${datePart}T${timePart}:00`;

        const loading = await this.loadingCtrl.create({
            message: 'Conectando con Mercado Pago...',
        });
        await loading.present();

        const payload: any = {
            professional,
            start_datetime: startDatetimeBackend,
            duration_minutes: duration,
            modality: modality || undefined,
            reason: (reason || '').trim()
        };

        // 2. Llamar al servicio de Mercado Pago
        this.mpService.crearPreferencia(payload).subscribe({
            next: (respuesta) => {
                loading.dismiss();
                console.log('Preferencia recibida:', respuesta);

                if (respuesta.init_point) {
                    // Redirige al checkout de MP
                    window.location.href = respuesta.init_point;
                } else {
                    this.presentToast('Error: No se pudo obtener el link de pago.');
                }
            },
            error: (error) => {
                loading.dismiss();
                console.error('Error al crear la preferencia:', error);
                this.presentToast('Error al conectar con el servidor de pago. Revisa tu conexión.');
            }
        });
    }

    cancel(id: number) {
        this.svc.updateAppointment(id, { status: 'cancelled' }).subscribe({
            next: () => {
            this.presentToast('Cita cancelada');
            // 🎯 Actualiza el estado localmente para reflejar el cambio al instante
            const index = this._allAppointments.findIndex(a => a.id === id);
            if (index !== -1) {
                this._allAppointments[index].status = 'cancelled';
                // La próxima vez que se acceda a 'this.appointments', la cita se filtrará
            }
            },
            error: () => this.presentToast('No se pudo cancelar')
        });
        }


    // ⏰ MÉTODOS DE MANEJO DE SLOTS:

    formatSlotLabel(s: string): string {
        return s.slice(0, 5);
    }

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

    getDatePartISO(val: any): string | null {
        if (!val) return null;
        const iso = String(val);
        return iso.split('T')[0] || null;
    }

    refreshBusy(professionalId: number, dateISO: string) {
  // 1. Limpieza inmediata de datos anteriores (MANTENER ESTO)
  this.busyPro = [];
  this.busyPatient = [];
  this.busyTimes = [];
  this.slotStatus = {};
  this.recomputeSlotStatus(dateISO);

  this.svc.getBusy(professionalId, dateISO).subscribe({
    next: (res: any) => {
      // 🛑 ELIMINAMOS EL FILTRO: backend ya garantiza que los datos están filtrados
      const proAppointments = res.professional;

      // 2. Asignación de busyPro
      this.busyPro = proAppointments.map((x: any) => ({ start: new Date(x.start), end: new Date(x.end) }));

      // Asignación de busyPatient
      this.busyPatient = res.patient.map((x: any) => ({ start: new Date(x.start), end: new Date(x.end) }));

      // Asignación de busyTimes
      this.busyTimes = proAppointments.map((x: any) => {
        const d = new Date(x.start);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      });

      this.recomputeSlotStatus(dateISO);
    },
    error: err => {
      console.error('busy error', err);
      this.busyPro = [];
      this.busyPatient = [];
      this.busyTimes = [];
      this.recomputeSlotStatus(dateISO);
    }
  });
}
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

    isStartDisabled(s: string): boolean {
        const dur = Number(this.form.get('duration')!.value) || 0;
        const dateISO = this.getDatePartISO(this.form.get('date')!.value);
        if (!dateISO || dur <= 0) return true;

        const start = new Date(`${dateISO}T${s}`);
        const end   = new Date(start.getTime() + dur * 60000);
        return this.overlapsAny(start, end, [...this.busyPro, ...this.busyPatient]);
    }

    overlapsAny(aStart: Date, aEnd: Date, intervals: {start: Date; end: Date;}[]): boolean {
        return intervals.some(iv => (aStart < iv.end) && (aEnd > iv.start));
    }

    selectTime(s: string) {
        if (!this.isStartDisabled(s)) {
            this.form.get('time')!.setValue(s);
            this.presentToast(`Seleccionaste ${this.formatSlotLabel(s)}`);
        }
    }
}