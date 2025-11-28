import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,  } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-fallido',
  templateUrl: './fallido.page.html',
  styleUrls: ['./fallido.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonIcon, IonButton, IonContent, CommonModule, FormsModule]
})
export class FallidoPage implements OnInit, OnDestroy {
  countdown = 5;
  private timerSubscription: Subscription | undefined;

  constructor(private router: Router) {
    addIcons({ closeCircleOutline });
  }

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    // Asegurarse de limpiar el intervalo si el componente se destruye
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  startCountdown() {
    const timer$ = interval(1000);

    this.timerSubscription = timer$.subscribe(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.timerSubscription?.unsubscribe();
        this.goToSearch();
      }
    });
  }

  goToSearch() {
    this.timerSubscription?.unsubscribe();
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
