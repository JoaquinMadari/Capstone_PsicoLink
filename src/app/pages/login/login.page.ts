import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonSpinner
} from '@ionic/angular/standalone'
import { firstValueFrom } from 'rxjs';


function normalizeEmail(v: unknown): string {
  return String(v ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,

  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner]


})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  errorMessage: string = '';
  loading = false;

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
    const role = localStorage.getItem('user_role') || localStorage.getItem('role') || '';
    if (role === 'profesional') {
      this.router.navigate(['/pro/home']);
    } else {
      // Paciente
      this.router.navigate(['/tabs/home']);
    }
  } catch {
    this.errorMessage = 'Usuario o contraseña incorrectos';
  } finally {
    this.loading = false;
  }
}
}