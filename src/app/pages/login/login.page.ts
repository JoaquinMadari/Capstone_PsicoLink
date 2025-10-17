import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton
} from '@ionic/angular/standalone'

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,

  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton]


})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  login() {
    if (!this.loginForm.valid) return;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (resp) => {
        localStorage.setItem('access', resp.access);
        localStorage.setItem('refresh', resp.refresh);
        const role = resp?.user?.role || null;
        if (role) localStorage.setItem('role', role);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
      },
    });
  }
}