import { Component, OnInit, inject } from '@angular/core'; // Añadir 'inject'
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { arrowForwardOutline, checkmarkCircleOutline, helpCircleOutline, hourglassOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { 
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonTitle,
    IonBackButton,
    IonButtons, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonIcon,
    IonNote
} from '@ionic/angular/standalone';

addIcons({ arrowForwardOutline, checkmarkCircleOutline, helpCircleOutline, hourglassOutline });

type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.page.html',
  styleUrls: ['./ticket-list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton,
    IonButtons, IonList, IonItem, IonLabel, IonIcon, IonNote
  ]
})
export class TicketListPage implements OnInit {
  private soporteService = inject(SoporteService);
  private router = inject(Router);
  private location = inject(Location);

  tickets: SupportTicket[] = [];
  loading = true;
  error: string | null = null;
  private sub?: Subscription;

  role: Role = 'admin';
  base = '/admin';
  backHref = '/admin/dashboard';

  private routerSub?: Subscription;

  ngOnInit() {
    this.resolveRoleAndBack();
    this.loadTickets();

    this.routerSub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    try { this.routerSub?.unsubscribe(); } catch {}
  }

  private resolveRoleAndBack() {
    const r = (localStorage.getItem('user_role') || localStorage.getItem('role') || 'admin') as Role;
    this.role = r;
    this.base = '/admin';
    this.backHref = `${this.base}/dashboard`;

    const st = this.location.getState() as { from?: string };
    const from = (typeof st?.from === 'string' && st.from.length) ? st.from : null;
    if (from) this.backHref = from;
  }

  onBackClick() {
    (document.activeElement as HTMLElement | null)?.blur?.();
  }

  loadTickets() {
    this.loading = true;
    this.error = null;
        
    this.sub = this.soporteService.getTicketsForAdmin().subscribe({ 
      next: (data) => {
        this.tickets = data.sort((a: any, b: any) => {
          if (a.status === 'abierto' && b.status !== 'abierto') return -1;
          if (b.status === 'abierto' && a.status !== 'abierto') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar tickets (Admin):', err);
        this.error = 'No se pudieron cargar los tickets del sistema.';
        this.loading = false;
      }
    });
  }
    
  getStatusColor(status: SupportTicket['status']): string {
    switch (status) {
      case 'cerrado': return 'success';
      case 'en_proceso': return 'warning';
      case 'abierto': default: return 'medium';
    }
  }

  getStatusIcon(status: SupportTicket['status']): string {
    switch (status) {
      case 'cerrado': return 'checkmark-circle-outline';
      case 'en_proceso': return 'hourglass-outline';
      case 'abierto': default: return 'help-circle-outline';
    }
  }

  getSummary(message: string): string {
    return message.length > 50 ? message.substring(0, 47) + '...' : message;
  }
}
