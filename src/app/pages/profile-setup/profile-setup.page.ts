import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonSelectOption, IonToggle, IonSelect, IonTextarea  } from '@ionic/angular/standalone'
import { Router } from '@angular/router';
import { Auth } from 'src/app/services/auth';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.page.html',
  styleUrls: ['./profile-setup.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput,IonButton, IonSelectOption, IonToggle, IonSelect, IonTextarea ]
})
export class ProfileSetupPage implements OnInit {
  profileForm!: FormGroup;
  role: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: Auth, // Servicio para obtener datos del usuario y enviar el perfil
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
  this.authService.getCurrentUserRole().subscribe(role => {
    if (role) {
      // El rol es un string
      this.role = role; 
      this.initializeForm(role);

    } else {
      // El rol es null
      this.router.navigate(['/login']);
    }
  });
}

  // Crea el formulario basado en el rol
 initializeForm(role: string) {
    let formConfig: any;

    if (role === 'organizacion') {
        // Los campos de Organización son completamente diferentes de BaseProfile
        formConfig = this.fb.group({
            // Campos Obligatorios
            organization_name: ['', Validators.required],
            organization_rut: ['', Validators.required],
            contact_email: ['', [Validators.required, Validators.email]],
            
            // Campos Opcionales
            contact_phone: [''],
            num_employees: [''],
            company_sector: [''],
            location: [''],
            service_type_required: [''],
            preference_modality: [''],
            type_of_attention: [''],
            service_frequency: [''],
        });

    } else {
        //Campos Base (Comunes a Paciente y Profesional)
        const baseFields = {
            rut: ['', Validators.required],
            age: ['', Validators.required],
            gender: ['', Validators.required],
            nationality: ['', Validators.required],
            phone: ['', Validators.required],
            payment_method: ['algo'],
            address: ['algo'], // Opcional o condicional
        };

        let specificFields = {};

        //Campos Específicos para PROFESIONAL
        if (role === 'profesional') {
            specificFields = {
                specialty: ['', Validators.required],
                license_number: ['', Validators.required],
                
                // Campos obligatorios
                main_focus: ['', Validators.required],
                therapeutic_techniques: ['', Validators.required],
                style_of_attention: ['', Validators.required],
                attention_schedule: ['', Validators.required],
                work_modality: ['', Validators.required],
                certificates: [''],
                
                // Campos opcionales
                inclusive_orientation: [false],
                languages: [''],
                experience_years: [null],
                curriculum_vitae: [''],
            };
        } 
        
        // Campos Específicos para PACIENTE
        else if (role === 'paciente') {
            specificFields = {
                base_disease: ['', Validators.required],
                disability: [false, Validators.required],
                
                // Campos opcionales
                description: [''],
                consultation_reason: [''],
                preference_modality: [''],
                preferred_focus: [''],
            };
        } 
        formConfig = this.fb.group({ ...baseFields, ...specificFields });
    }
    this.profileForm = formConfig;
}

  saveProfile() {
    if (!this.profileForm.valid) return;

    const data = this.profileForm.value;

    if (data.experience_years === '' || data.experience_years === undefined) {
        data.experience_years = null;
    }
    // Llamar al endpoint /api/profile/setup/
    this.authService.completeProfile(data).subscribe({
      next: (_) => {
        this.presentToast('Perfil completado. ¡Bienvenido!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error al guardar el perfil.';
        this.presentToast(errorMsg);
      }
    });
  }

  skipSetup() {
    // Si el usuario omite, asume que solo se guardaron los datos obligatorios del registro inicial
    this.presentToast('Perfil incompleto. Puedes completarlo más tarde.');
    this.router.navigate(['/home']);
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}

