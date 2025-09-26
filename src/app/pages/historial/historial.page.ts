import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    CommonModule,
    FormsModule,
  ]
})
export class HistorialPage {
  citas = [
    { profesional: 'Dra. Ana Pérez', fecha: '20/09/2025', hora: '10:00 AM' },
    { profesional: 'Dr. Carlos Ruiz', fecha: '15/09/2025', hora: '4:00 PM' },
    { profesional: 'Lic. María Gómez', fecha: '10/09/2025', hora: '2:30 PM' },
  ];
}

