import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Auth } from 'src/app/services/auth';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonButton,
  ],
})
export class AccountPage {
  role = localStorage.getItem('role') || '';

  constructor(private auth: Auth, private router: Router) {}

  connectZoom() {
    const clientId = environment.zoomClientId;
    const redirectUri = 'http://127.0.0.1:8000/api/zoom/oauth/callback/';
    const userId = localStorage.getItem('user_id');

    if (!userId) {
      console.error("⚠️ No hay user_id en localStorage. No se puede conectar Zoom.");
      return;
    }

    const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`;
    window.location.href = zoomAuthUrl;
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}


