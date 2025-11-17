import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from 'src/app/services/auth';
import { logOutOutline, ticketOutline, peopleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonGrid, IonRow, IonCol, IonIcon, IonLabel, IonButtons
} from '@ionic/angular/standalone';

addIcons({ logOutOutline, ticketOutline, peopleOutline });

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonGrid, IonRow, IonCol, IonIcon, IonLabel, IonButtons, RouterModule
  ]
})
export class DashboardPage implements OnInit {
  private router = inject(Router);
  private authService = inject(Auth); 
  
  constructor() { }

  ngOnInit() {
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
