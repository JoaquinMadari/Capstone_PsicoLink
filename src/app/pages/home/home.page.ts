import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
IonButton, IonButtons} from '@ionic/angular/standalone'
import { Auth } from 'src/app/services/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,

imports: [CommonModule,IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonButtons, RouterModule]

})
export class HomePage implements OnInit {
  userName = 'Usuario';

  constructor(private router: Router, private authService: Auth) {}

  ngOnInit() {}

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

}
