import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, 
         IonCardContent, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption, 
         IonSpinner,  IonButton, IonButtons, IonBackButton, ToastController, 
         IonToggle } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { SoporteService } from 'src/app/services/soporte';

interface UserDetail {
  id: number;
  email: string;
  role: 'paciente' | 'profesional' | 'admin' | 'organizacion';
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.page.html',
  styleUrls: ['./user-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption, IonSpinner, 
     IonButton, IonButtons, IonBackButton, IonToggle]
})
export class UserDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private soporteService = inject(SoporteService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  userId!: number;
  user: UserDetail | null = null;
  loading = true;
  submitting = false;
  error: string | null = null;
  userForm!: FormGroup;
  
  private sub?: Subscription;

  roleOptions = [
    { value: 'paciente', label: 'Paciente' },
    { value: 'profesional', label: 'Profesional' },
    { value: 'organizacion', label: 'Organización' },
    { value: 'admin', label: 'Administrador' },
  ];

  constructor() {
    this.userForm = this.fb.group({
      role: ['', Validators.required],
      is_active: [true, Validators.required]
    });
  }

  ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(this.userId) || this.userId === 0) {
      this.error = 'ID de usuario no válido.';
      this.loading = false;
      return;
    }
    this.loadUserDetails();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadUserDetails() {
    this.loading = true;
    this.error = null;
    
    this.sub = this.soporteService.getUserDetailForAdmin(this.userId).subscribe({
      next: (data: any) => {
        this.user = data as UserDetail;
        this.loading = false;
        
        // Cargar los datos al formulario para edición
        this.userForm.patchValue({
          role: data.role,
          is_active: data.is_active
        });
      },
      error: (err) => {
        console.error('Error al cargar detalle del usuario:', err);
        this.error = 'No se pudo cargar el detalle del usuario.';
        this.loading = false;
      }
    });
  }
  
  async submitUpdate() {
    if (this.userForm.invalid || this.submitting) {
      this.userForm.markAllAsTouched();
      await this.presentToast('Por favor, revisa los campos requeridos.', 'danger');
      return;
    }
    
    this.submitting = true;
    const payload = this.userForm.value;

    //Actualizar usuario
    this.soporteService.updateUser(this.userId, payload).subscribe({
      next: async (updatedUser) => {
        this.user = updatedUser;
        this.submitting = false;
        await this.presentToast('Usuario actualizado con éxito.', 'success');
      },
      error: async (err) => {
        this.submitting = false;
        await this.presentToast('Error al actualizar el usuario.', 'danger');
        console.error('Error updating user:', err);
      }
    });
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
    });
    toast.present();
  }
  
  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }
}
