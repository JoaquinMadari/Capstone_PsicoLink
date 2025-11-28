import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from 'src/app/services/appointment';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { Location } from '@angular/common';

type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';
@Component({
  selector: 'app-mis-notas',
  templateUrl: './mis-notas.page.html',
  styleUrls: ['./mis-notas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MisNotasPage implements OnInit {
  appointmentId: string | null = null;
  nuevaNota: string = '';
  historialNotas: { id: number; text: string; fecha: string }[] = [];
  role: string | null = null;
  status: string | null = null;
  canEdit: boolean = false;
  isVisible: boolean = false;
  userRole: string = '';
  appointmentCompleted: boolean = false;
  base = '/tabs';
  backHref = '/tabs/home';

  private routerSub?: Subscription;

  CLOSING_GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutos en milisegundos (Debe coincidir con el backend)

  constructor(
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private appointmentService: AppointmentService,
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit() {
    this.resolveRoleAndBack();


    // Evita focus atrapado al navegar hacia atrás / entre outlets
    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
    this.appointmentId = this.route.snapshot.paramMap.get('id');
    this.userRole = localStorage.getItem('user_role') || '';

    if (!this.appointmentId) return;

    this.appointmentService.getAppointment(Number(this.appointmentId)).subscribe({
      next: (res) => {
        this.nuevaNota = '';
        this.status = res.status;

        // Cargar el historial de notas desde la API
        this.cargarHistorialNotas();

        // Mostrar textarea solo si es profesional
        this.isVisible = this.userRole === 'profesional';

        // Permitir editar siempre si es profesional
        this.canEdit = this.isVisible;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar la cita', err);
      },
    });
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

  //  Cargar historial de notas desde el endpoint específico
  cargarHistorialNotas() {
    if (!this.appointmentId) return;
    
    this.appointmentService.getAppointmentNotesList(Number(this.appointmentId)).subscribe({
      next: (notas) => {
        this.historialNotas = notas.map(nota => ({
          id: nota.id,
          text: nota.text,
          fecha: nota.fecha
        }));
        console.log('Historial de notas cargado:', this.historialNotas);
      },
      error: (err) => {
        console.error('Error cargando historial de notas:', err);
        // Si falla, intentamos cargar desde el campo historial del appointment
        this.appointmentService.getAppointment(Number(this.appointmentId)).subscribe(appointment => {
          this.historialNotas = appointment.historial || [];
        });
      }
    });
  }

  //  Getter para saber si hay notas
  get hasNotas(): boolean {
    return this.historialNotas.length > 0;
  }

  async guardarNota() {
    if (!this.nuevaNota.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'No has escrito ninguna nota',
        duration: 2000,
      });
      await toast.present();
      return;
    }

    if (!this.canEdit) {
      const toast = await this.toastCtrl.create({
        message: 'No tienes permisos para agregar notas',
        duration: 2000,
      });
      await toast.present();
      return;
    }

    this.appointmentService.createAppointmentNote(Number(this.appointmentId), this.nuevaNota).subscribe({
      next: async (nuevaNotaCreada) => {
        const toast = await this.toastCtrl.create({
          message: 'Nota agregada correctamente',
          duration: 2000,
        });
        await toast.present();

        // Agregar la nueva nota al historial
        this.historialNotas = [
          ...this.historialNotas,
          { 
            id: nuevaNotaCreada.id, 
            text: nuevaNotaCreada.text, 
            fecha: nuevaNotaCreada.fecha 
          },
        ];
        
        this.nuevaNota = ''; // Limpiar el campo de nueva nota
      },
      error: async (error) => {
        console.error('Error al guardar la nota:', error);
        let mensaje = 'Error al guardar la nota';
        
        if (error.status === 403) {
          mensaje = 'No tienes permisos para agregar notas';
        } else if (error.status === 400) {
          mensaje = error.error?.detail || 'No se pueden agregar notas a esta cita';
        }

        const toast = await this.toastCtrl.create({
          message: mensaje,
          duration: 3000,
        });
        await toast.present();
      },
    });
  }

  formatearFecha(fechaISO: string): string {
    return new Date(fechaISO).toLocaleString('es-ES');
  }
}