import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProfessionalProfile, ProfessionalService } from '../../services/professional-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ProfessionalService);
  private toast = inject(ToastController);

  loading = true;
  error?: string;
  data?: ProfessionalProfile;

  viewerRole: 'profesional' | 'paciente' | 'organizacion' | 'admin' | undefined;

  ngOnInit(): void {
    // Rol del usuario logueado
    const roleLS = localStorage.getItem('role');
    this.viewerRole = (roleLS as any) || undefined;

    const idParam = this.route.snapshot.paramMap.get('id');
    const userId = idParam ? Number(idParam) : undefined;

    if (!userId || Number.isNaN(userId)) {
      this.error = 'ID de profesional inválido.';
      this.loading = false;
      return;
    }

    this.svc.getProfessionalDetail(userId).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: async (err) => {
        this.loading = false;
        this.error = 'No fue posible cargar el perfil profesional.';
        const t = await this.toast.create({ message: this.error, duration: 2500, color: 'danger' });
        t.present();
      }
    });
  }

  isPatientView(): boolean {
    return this.viewerRole === 'paciente';
  }

  callPhone(phone: string) {
    window.location.href = `tel:${phone}`;
  }

  openCV(url?: string | null) {
    if (!url) return;
    window.open(url, '_blank');
  }

  bookAppointment() {
    if (!this.data?.user?.id) return;
    // Ajusta a tu ruta real para agendamiento
    this.router.navigate(['/Agendar'], { queryParams: { professionalId: this.data.user.id } });
  }
}
