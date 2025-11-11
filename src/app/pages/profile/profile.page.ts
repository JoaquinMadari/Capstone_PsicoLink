import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, RouterModule, Router, NavigationStart } from '@angular/router';
import { ProfessionalProfile, ProfessionalService } from '../../services/professional-service';
import { Subscription } from 'rxjs';

//codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ProfessionalService);
  private toast = inject(ToastController);

  loading = true;
  error?: string;
  data?: ProfessionalProfile;

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  role: Role = 'paciente';
  base = '/tabs';
  backHref = '/tabs/home';
  private routerSub?: Subscription;
  constructor(
      private location: Location,
    ) {}
  

  viewerRole: 'profesional' | 'paciente' | 'organizacion' | 'admin' | undefined;

  ngOnInit(): void {
    this.resolveRoleAndBack(); //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)

    // Evita focus atrapado al navegar (previene crash en back)
    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
    
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


  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  ngOnDestroy(): void {
    try { this.routerSub?.unsubscribe(); } catch {}
  }

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  private resolveRoleAndBack() {
    const r = (localStorage.getItem('user_role') || localStorage.getItem('role') || 'paciente') as Role;
    this.role = r;
    this.base = r === 'profesional' ? '/pro' : '/tabs';
    this.backHref = `${this.base}/home`;

    //leer 'from' desde el history state
    const st = this.location.getState() as { from?: string };
    const from = (typeof st?.from === 'string' && st.from.length) ? st.from : null;
    if (from) this.backHref = from;
  }

  //codigo replicado para devolvernos a la page anterior correctamente (post-pro/tabs)
  onBackClick() {
    // defensa para accesibilidad y evitar focos en páginas ocultas
    (document.activeElement as HTMLElement | null)?.blur?.();
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
    this.router.navigate(['/Agendar'], { queryParams: { professionalId: this.data.user.id } });
  }
}
