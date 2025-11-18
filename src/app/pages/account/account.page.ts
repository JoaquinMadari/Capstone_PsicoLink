import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonCard, IonInput, IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import {  AlertController } from '@ionic/angular';
import { Auth } from 'src/app/services/auth';
import { environment } from 'src/environments/environment';
import { ProfileService } from 'src/app/services/profile';
import { FormsModule } from '@angular/forms';

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
    IonButton,
    FormsModule,
    IonCard,
    IonInput,
    IonSpinner,
  ],
})
export class AccountPage {
  role = localStorage.getItem('role') || '';
  loading = true;
  editing = false;

  // campos editables
  first_name = '';
  last_name = '';
  email = '';
  phone = '';
  specialty = '';
  session_price: number | null = null; // <-- NUEVO CAMPO

  constructor(
    private auth: Auth,
    private router: Router,
    private alertCtrl: AlertController,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getMyProfile().subscribe({
      next: (data) => {
        this.first_name = data.first_name || '';
        this.last_name = data.last_name || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.specialty = data.specialty || '';
        this.role = data.role || this.role;

        // cargar precio solo si es profesional
        if (this.role === 'profesional') {
          this.session_price = data.session_price ?? null;
        }

        this.loading = false;
      },
      error: async (err) => {
        console.error('Error cargando perfil', err);
        this.loading = false;
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo cargar tu perfil.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  toggleEdit() {
    this.editing = !this.editing;
  }

  saveChanges() {
    const payload: any = {
      email: this.email,
      phone: this.phone
    };

    // incluir solo si es profesional
    if (this.role === 'profesional') {
      payload.session_price = this.session_price;
    }

    this.profileService.updateMyProfile(payload).subscribe({
      next: async (res) => {
        this.editing = false;
        this.loadProfile(); // refrescar
        const alert = await this.alertCtrl.create({
          header: 'Listo',
          message: 'Perfil actualizado correctamente.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        console.error('Error actualizando perfil', err);
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.detail || 'Ocurrió un error al actualizar.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async connectZoom() {
    const clientId = environment.zoomClientId;
    const redirectUri = 'http://127.0.0.1:8000/api/zoom/oauth/callback/';
    const userId = localStorage.getItem('user_id');

    if (!userId) {
      const alert = await this.alertCtrl.create({
        header: 'Usuario no identificado',
        message: 'No se encontró tu ID de usuario. Por favor, inicia sesión nuevamente.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`;
    window.location.href = zoomAuthUrl;
  }

  async logout() {
    await this.auth.logout();
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
