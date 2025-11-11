import { Component, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
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
  IonBackButton
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
    FormsModule,  // ✅ agregado aquí
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
    IonBackButton
  ],
})
export class SoportePage {
  nombre: string = '';
  email: string = '';
  mensaje: string = '';

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

  enviarSoporte() {
    if (!this.nombre || !this.email || !this.mensaje) {
      alert('Por favor completa todos los campos.');
      return;
    }

    console.log('Soporte enviado:', {
      nombre: this.nombre,
      email: this.email,
      mensaje: this.mensaje,
    });

    alert('Tu mensaje fue enviado. Te responderemos pronto.');

    // Limpiar formulario
    this.nombre = '';
    this.email = '';
    this.mensaje = '';
  }
}


