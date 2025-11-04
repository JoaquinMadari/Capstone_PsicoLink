import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // 1. Importar Router
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-exitoso',
  templateUrl: './exitoso.page.html',
  styleUrls: ['./exitoso.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonButton, IonIcon
  ]
})
export class ExitosoPage {

  countdown = 5; // El contador de 5 segundos
  private timer: any; // Para guardar la referencia del temporizador

  constructor(
    private router: Router // 2. Inyectar el Router
  ) {
    addIcons({ checkmarkCircleOutline });
  }

  // 3. Usar ionViewDidEnter para iniciar el temporizador cuando la página es visible
  ionViewDidEnter() {
    console.log('Página de éxito cargada. Iniciando temporizador...');
    
    this.timer = setInterval(() => {
      this.countdown--; // Restar 1 al contador
      
      if (this.countdown === 0) {
        clearInterval(this.timer); // Detener el temporizador
        console.log('Temporizador cumplido. Redirigiendo a /agendar-cita...');
        
        // 4. Redirigir a la página de "Mis Citas"
        // (Asegúrate de que '/agendar-cita' es la ruta correcta de tu lista de citas)
        this.router.navigate(['/mis-citas']);
      }
    }, 1000); // 1000ms = 1 segundo
  }

  // 5. (Buena Práctica) Limpiar el temporizador si el usuario se va
  ionViewWillLeave() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

}