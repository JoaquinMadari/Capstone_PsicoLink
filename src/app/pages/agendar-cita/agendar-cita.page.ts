import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    ToastController, // Consolidado
    AlertController, // Consolidado
    LoadingController // Consolidado
} from '@ionic/angular';
import { AppointmentService } from 'src/app/services/appointment';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime,
    IonRow, IonCol, IonChip, IonGrid, IonCardSubtitle
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router'; // Consolidado
import { HttpClientModule } from '@angular/common/http';
import { MercadoPago as MercadopagoService } from  'src/app/services/mercado-pago'; // Asumo que esta ruta es correcta

@Component({
    selector: 'app-agendar-cita',
    templateUrl: './agendar-cita.page.html',
    styleUrls: ['./agendar-cita.page.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
        IonButton, IonButtons, IonBackButton, IonLabel, IonItem, IonList, IonSelectOption, IonSelect, IonInput, IonDatetime,
        IonRow, IonCol, IonChip, IonGrid, IonCardSubtitle,
        HttpClientModule
    ]
})
export class AgendarCitaPage implements OnInit {

    // 💡 CONSTRUCTOR CONSOLIDADO: Incluye todas las inyecciones necesarias,
    // incluyendo las nuevas para Mercado Pago y LoadingController,
    // además del AlertController y el Router.
    constructor(
        private fb: FormBuilder,
        private svc: AppointmentService,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController, // Necesario para la alerta de Zoom/Mis Citas
        private router: Router, // Necesario para navegar a /mis-citas
        private route: ActivatedRoute,
        private mpService: MercadopagoService, // Nueva inyección
        private loadingCtrl: LoadingController // Nueva inyección
    ) {}

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
    appointments: any[] = [];
    busyTimes: string[] = [];

    get selectedProfessional() {
        const id = this.form.get('professional')!.value;
        return this.professionals.find(p => p.id === id);
    }

    // --------- Slots / disponibilidad ----------
    STEP_MINUTES = 30;
    DAY_START = '08:00';
    DAY_END    = '20:00';

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

    // El resto de ngOnInit y otros métodos (configureModalityValidators, presentToast, loadProfessionals, loadAppointments)
    // se mantienen correctos y sin cambios.
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
        const toast = await this.toastCtrl.create({ message: msg, duration: 2500 });
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
            next: (res) => { this.appointments = res; },
            error: (err) => console.error(err)
        });
    }

    // 💰 FUNCIÓN CENTRAL: Llama a Mercado Pago.
    // Esto reemplaza la antigua función onCreate.
    // **Asegúrate de cambiar el (click) en tu HTML a iniciarPago()**
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
            this.presentToast('Por favor selecciona la fecha y hora.');
            return;
        }

        // 1. Calcular la fecha/hora de inicio en formato ISO para el backend
        const datePart = date.split('T')[0];
        const timePart = time.split(':').slice(0, 2).join(':');
        const local = new Date(`${datePart}T${timePart}:00`);
        // Ojo: Si el backend espera UTC, asegúrate de que use local.toISOString()
        // Si espera la hora local, usa el formato 'YYYY-MM-DDTHH:MM:SS'
        const startDatetimeBackend = local.toISOString(); // Recomendado: UTC/ISO para el backend

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
                    window.location.href = respuesta.init_point;
                } else {
                    this.presentToast('Error: No se pudo obtener el link de pago.');
                }
            },
            error: (error) => {
                loading.dismiss();
                console.error('Error al crear la preferencia:', error);
                this.presentToast('Error al conectar con el servidor de pago.');
            }
        });
    }

    // ❌ FUNCIÓN CANCEL CONSOLIDADA: Se elimina la duplicación.
    cancel(id: number) {
        this.svc.updateAppointment(id, { status: 'cancelled' }).subscribe({
            next: () => {
                this.presentToast('Cita cancelada');
                this.loadAppointments();
            },
            error: () => this.presentToast('No se pudo cancelar')
        });
    }
    
    // ⏰ MÉTODOS DE MANEJO DE SLOTS: Se consolidan y se corrigen los errores de sintaxis (que eran efectos de la duplicación).

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
        this.svc.getBusy(professionalId, dateISO).subscribe({
            next: (res) => {
                this.busyPro = res.professional.map(x => ({ start: new Date(x.start), end: new Date(x.end) }));
                this.busyPatient = res.patient.map(x => ({ start: new Date(x.start), end: new Date(x.end) }));
                this.busyTimes = res.professional.map(x => {
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