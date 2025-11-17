import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { SoporteService } from 'src/app/services/soporte';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  IonInput
} from '@ionic/angular/standalone';

//codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.page.html',
  styleUrls: ['./soporte.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonTextarea,
    IonButton,
    IonButtons,
    IonBackButton,
    IonInput
  ],
})
export class SoportePage {

  private soporteService = inject(SoporteService);
  private toastCtrl = inject(ToastController);
  private fb = inject(FormBuilder);

  soporteForm!: FormGroup;

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  role: Role = 'paciente';
  base = '/tabs';
  backHref = '/tabs/home';
  private routerSub?: Subscription;
  constructor(
    private router: Router,
    private location: Location,
  ) {}

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  ngOnInit() {
    this.resolveRoleAndBack();

    const nombrePrecargado = localStorage.getItem('user_full_name') || ''; 
    const emailPrecargado = localStorage.getItem('user_email') || '';

    this.soporteForm = this.fb.group({
        nombre: [nombrePrecargado, [Validators.required]],
        email: [emailPrecargado, [Validators.required, Validators.email]],
        asunto: ['', [Validators.required, Validators.maxLength(250)]],
        mensaje: ['', [Validators.required]]
    });

    // Evita focus atrapado al navegar hacia atrás / entre outlets
    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
  }

  ngOnDestroy(): void {
    try { this.routerSub?.unsubscribe(); } catch {}
  }

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
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

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  onBackClick() {
    // defensa para accesibilidad y evitar focos en páginas ocultas
    (document.activeElement as HTMLElement | null)?.blur?.();
  }

  async enviarSoporte() {
    if (this.soporteForm.invalid) {
      this.soporteForm.markAllAsTouched();
      await this.presentToast('Por favor completa todos los campos correctamente.', 'warning');
      return;
    }

    const { nombre, email, asunto, mensaje } = this.soporteForm.value;

    const payload = {
      name: nombre,
      email: email,
      message: mensaje,
      subject: asunto
    };
 
    //LLAMADA AL SERVICIO
    this.soporteService.submitTicket(payload).subscribe({
      next: async (res) => {
        await this.presentToast('Tu mensaje fue enviado con éxito. Te responderemos pronto.', 'success');
        // Limpiar formulario (resetear a los valores precargados)
        const nombrePrecargado = localStorage.getItem('user_full_name') || ''; 
        const emailPrecargado = localStorage.getItem('user_email') || '';

        this.soporteForm.reset({
            nombre: nombrePrecargado,
            email: emailPrecargado,
            asunto: '',
            mensaje: ''
          });
      },
      error: async (err) => {
        console.error('Error al enviar soporte:', err);
        await this.presentToast('Error al enviar el ticket. Intenta más tarde.', 'danger');
      }
    });
  }
  
  //FUNCIÓN AUXILIAR PARA TOAST
  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
    });
    toast.present();
  }
}
