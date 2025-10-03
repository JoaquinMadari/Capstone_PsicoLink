import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-detalle-cita',
  templateUrl: './detalle-cita.page.html',
  styleUrls: ['./detalle-cita.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle]
  
})
export class DetalleCitaPage {
  profesional!: string;
  fecha!: string;
  hora!: string;

  constructor(private route: ActivatedRoute) {
    // Recuperamos los parámetros que vienen en la URL
    this.profesional = this.route.snapshot.paramMap.get('profesional') || '';
    this.fecha = this.route.snapshot.paramMap.get('fecha') || '';
    this.hora = this.route.snapshot.paramMap.get('hora') || '';
  }
}
