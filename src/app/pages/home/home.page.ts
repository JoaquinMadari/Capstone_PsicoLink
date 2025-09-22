import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HomePage implements OnInit {

  userName: string = 'Usuario'; // aquí puedes asignar el nombre real desde tu servicio/auth

  constructor(private router: Router) {}

  ngOnInit() {
    // Aquí podrías cargar el nombre del usuario logueado desde tu servicio de autenticación
  }

  goTo(route: string) {
    console.log(`Navegar a: ${route}`);
    // Navegación: ajustar las rutas reales de tu app
    this.router.navigate([`/${route}`]);
  }

  logout() {
    console.log('Cerrar sesión');
    // Aquí va tu lógica de logout (limpiar token, etc.)
    this.router.navigate(['/login']);
  }

}
