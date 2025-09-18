import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit {

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
  }

  async login() {
    if (this.loginForm.valid) {
      console.log('Formulario enviado:', this.loginForm.value);
      // Aquí iría la lógica de autenticación (ej. llamada a una API)
      const email = this.loginForm.value.email;
      const password = this.loginForm.value.password;

      // Ejemplo de lógica de autenticación simple
      if (email === 'test@psicolink.cl' && password === '123456') {
        this.presentToast('Inicio de sesión exitoso.', 'success');
        this.router.navigate(['/home']);
      } else {
        this.presentToast('Correo o contraseña incorrectos.', 'danger');
      }
    } else {
      this.presentToast('Por favor, completa todos los campos correctamente.', 'warning');
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'top',
    });
    toast.present();
  }
}
