import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from 'src/app/services/appointment';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-mis-notas',
  templateUrl: './mis-notas.page.html',
  styleUrls: ['./mis-notas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MisNotasPage {
  appointmentId: string | null = null;
  notes: string = '';
  historialNotas: { text: string; fecha: string }[] = []; // 👈 Inicializado
  role: string | null = null;
  status: string | null = null;
  canEdit: boolean = false;
  isVisible: boolean = false;
  userRole: string = '';
  appointmentCompleted: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id');
    this.userRole = localStorage.getItem('user_role') || '';

    if (!this.appointmentId) return;

    this.appointmentService.getAppointment(Number(this.appointmentId)).subscribe({
      next: (res) => {
        this.notes = res.notes || '';
        this.status = res.status;

        // historial que viene de la API
        this.historialNotas = res.historial || [];

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
   // ✅ Getter para saber si hay notas
  get hasNotas(): boolean {
    return this.historialNotas.length > 0;
  }

  async guardarNotas() {
    if (!this.notes.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'No has escrito ninguna nota',
        duration: 2000,
      });
      await toast.present();
      return;
    }

    if (!this.canEdit) {
      const toast = await this.toastCtrl.create({
        message: 'No tienes permisos para editar estas notas',
        duration: 2000,
      });
      await toast.present();
      return;
    }

    this.appointmentService.updateAppointmentNotes(Number(this.appointmentId), this.notes).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: res.detail || 'Notas guardadas correctamente',
          duration: 2000,
        });
        await toast.present();

        // Actualiza el historial para mostrar la nota nueva inmediatamente
        this.historialNotas = [
          ...this.historialNotas,
          { text: this.notes, fecha: new Date().toISOString() },
        ];
        this.notes = '';
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Error al guardar las notas',
          duration: 2000,
        });
        await toast.present();
      },
    });
  }
}





