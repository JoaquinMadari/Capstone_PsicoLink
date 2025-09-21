import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule,IonicModule,RouterModule]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      role: ['paciente', Validators.required], // valor por defecto
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],

      // estos se usan solo si es profesional
      specialty: [''],
      licenseNumber: ['']
    });
  }

  register() {
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;

      // 👇 si es profesional, aseguramos que los campos estén completos
      if (formData.role === 'profesional') {
        if (!formData.specialty || !formData.licenseNumber) {
          console.warn('Profesionales deben ingresar especialidad y número de licencia');
          return;
        }
      }

      console.log('Datos de registro:', formData);
      // Aquí deberías hacer la llamada al backend (API Django) o Supabase
    } else {
      console.warn('Formulario inválido');
      this.registerForm.markAllAsTouched();
    }
  }
  

}
