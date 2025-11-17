import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, 
         IonButtons, IonList, IonItem, IonLabel, IonIcon, IonNote, 
         IonSpinner, IonAlert, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { SoporteService } from 'src/app/services/soporte';

interface UserListItem {
    id: number;
    email: string;
    role: 'paciente' | 'profesional' | 'admin' | 'organizacion';
    is_active: boolean;
    date_joined: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton,
    IonButtons, IonList, IonItem, IonLabel, IonIcon, IonNote, 
    IonSpinner, IonAlert, IonRefresher, IonRefresherContent
  ]
})
export class UsersPage implements OnInit {
  private soporteService = inject(SoporteService);
  
  users: UserListItem[] = [];
  loading = true;
  error: string | null = null;
  private sub?: Subscription;
  
  // Establece el backHref para la navegación
  backHref = '/admin/dashboard'; 

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // Carga la lista de usuarios desde el backend
  loadUsers(event?: any) {
    this.loading = true;
    this.error = null;
    
    // Cancela la suscripción anterior si existe
    this.sub?.unsubscribe();

    this.sub = this.soporteService.getUsersForAdmin().subscribe({ 
      next: (data) => {
        // Ordena los usuarios, activos primero, luego por fecha
        this.users = data.sort((a: any, b: any) => {
            if (a.is_active !== b.is_active) {
                return a.is_active ? -1 : 1;
            }
            return new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime();
        });
        this.loading = false;
        event?.target.complete();
      },
      error: (err) => {
        console.error('Error al cargar usuarios (Admin):', err);
        this.error = 'No se pudieron cargar la lista de usuarios.';
        this.loading = false;
        event?.target.complete();
      }
    });
  }
    

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'person-circle-outline' : 'person-remove-outline';
  }
}