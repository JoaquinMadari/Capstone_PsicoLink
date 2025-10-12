import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonSegment, IonSegmentButton, IonButton } from '@ionic/angular/standalone'
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule,RouterModule,IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonSegment, IonSegmentButton, IonButton]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      role: ['paciente', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, // Duración del mensaje en milisegundos
      position: 'bottom', 
      color: 'dark' 
    });

    await toast.present();
  }
  
  register() {
  if (!this.registerForm.valid) return;

  const data = this.registerForm.value;
  
  this.authService.register(data).subscribe({
    next: (_) => { // _ para ignorar la respuesta
      this.presentToast('Registro inicial exitoso. Iniciando sesión...'); 
      
      // 1. INICIO DE SESIÓN AUTOMÁTICO
      this.authService.login({ 
          username: data.email, 
          password: data.password 
      }).subscribe({
          next: () => {
              // 2. REDIRECCIÓN TRAS EL LOGIN EXITOSO
              this.presentToast('Sesión iniciada. Por favor, completa tu perfil.'); 
              this.router.navigate(['/profile-setup']);
          },
          error: (loginErr) => {
              // Si el login falla
              this.presentToast('Error al iniciar sesión. Intenta loguearte manualmente.');
              this.router.navigate(['/login']); 
          }
      });
    },
    error: (err) => {
      // Manejar errores de validación del registro inicial (ej: email ya existe)
      this.presentToast(err.error?.email?.[0] || 'Error en el registro. Inténtalo de nuevo.');
    }
  });
}

}
