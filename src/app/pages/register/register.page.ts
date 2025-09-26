import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import {  IonHeader, IonToolbar, IonTitle, IonContent,  IonButton, IonInput, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule,RouterModule,IonicModule]//, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      role: ['paciente', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      specialty: [''],  // solo si es profesional
      licenseNumber: [''] // solo si es profesional
    });
  }

  register() {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;

      this.authService.register(data).subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.errorMessage = 'Error en el registro';
          console.error(err);
        }
      });
    }
  }
}
