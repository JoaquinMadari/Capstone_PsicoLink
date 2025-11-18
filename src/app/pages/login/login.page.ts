import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonIcon // <-- AGREGAR IONICON AQUÍ
} from '@ionic/angular/standalone'
import { firstValueFrom } from 'rxjs';
// Necesario para que los iconos de Ionic funcionen correctamente en Standalone
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';


function normalizeEmail(v: unknown): string {
  return String(v ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
}

// Registrar los iconos que vamos a usar
addIcons({ eyeOutline, eyeOffOutline });


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,

  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    // Asegúrate de que IonIcon esté en los imports para que el HTML funcione
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonIcon
  ]
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  errorMessage: string = '';
  loading = false;
  
  // 1. PROPIEDADES PARA LA VISIBILIDAD DE CONTRASEÑA
  /** Determina si el input es de tipo 'password' o 'text'. Por defecto: 'password'. */
  public passwordFieldType: string = 'password';

  /** Determina qué icono mostrar (ojo abierto o cerrado). Por defecto: false (oculto). */
  public passwordVisible: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
  
  // 2. FUNCIÓN PARA ALTERNAR LA VISIBILIDAD
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
    this.passwordFieldType = this.passwordVisible ? 'text' : 'password';
  }

  async login() {
    if (this.loginForm.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';

    //tomar valores del form
    const { email, password } = this.loginForm.value;

    //normalizar email
    const emailNorm = normalizeEmail(email);

    //reflejar en el form (para que el input quede “limpio”)
    this.loginForm.patchValue({ email: emailNorm }, { emitEvent: false });

    try {
    await firstValueFrom(this.authService.login({ email: emailNorm, password }));
    const isStaff = localStorage.getItem('user_is_staff') === 'true';
    const role = localStorage.getItem('user_role') || localStorage.getItem('role') || '';
    if (isStaff) {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'profesional') {
      this.router.navigate(['/pro/home']);
    } else {
      // Paciente
      this.router.navigate(['/tabs/home']);
    }
  } catch {
    this.errorMessage = 'Usuario o contraseÃ±a incorrectos';
  } finally {
    this.loading = false;
  }
  }
}