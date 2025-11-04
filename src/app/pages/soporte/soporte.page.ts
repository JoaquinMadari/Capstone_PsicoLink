import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ necesario para ngModel
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


