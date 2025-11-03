import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { hourglassOutline } from 'ionicons/icons';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-pendiente',
  templateUrl: './pendiente.page.html',
  styleUrls: ['./pendiente.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonIcon, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PendientePage implements OnInit, OnDestroy {
  countdown = 10; // Damos más tiempo para que lea
  private timerSubscription: Subscription | undefined;

  constructor(private router: Router) {
    addIcons({ hourglassOutline });
  }

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
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
        this.goToHome();
      }
    });
  }

  goToHome() {
    this.timerSubscription?.unsubscribe();
    // Lo enviamos al Home o a "Mis Citas"
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
