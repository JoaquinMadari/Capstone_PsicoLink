import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonSegment, IonSegmentButton, IonButton 
} from '@ionic/angular/standalone'
import { IonicModule } from '@ionic/angular';
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule,IonicModule,RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonSegment, IonSegmentButton, IonButton ]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  errorMessage = '';

  constructor(private fb: FormBuilder, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      role: ['paciente', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  register() {
    if (!this.registerForm.valid) return;

    const payload = this.registerForm.value;

    this.auth.register(payload).subscribe({
      next: () => {
        this.auth.login({ username: payload.email, password: payload.password }).subscribe({
          next: (resp) => {
            localStorage.setItem('access', resp.access);
            localStorage.setItem('refresh', resp.refresh);
            const role = resp?.user?.role || payload.role;
            if (role) localStorage.setItem('role', role);

            this.router.navigate(['/profile-setup']);
          },
          error: () => this.router.navigate(['/login'])
        });
      },
      error: (err) => {
        this.errorMessage = 'Error en el registro';
        console.error(err);
      }
    });
  }
}
