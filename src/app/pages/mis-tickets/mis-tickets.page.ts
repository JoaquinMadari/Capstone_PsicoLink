import { Component, OnInit } from '@angular/core';
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
  IonNote,
  IonSpinner,
  IonAlert
} from '@ionic/angular/standalone';

addIcons({ arrowForwardOutline, checkmarkCircleOutline, helpCircleOutline, hourglassOutline });

type Role = 'paciente' | 'profesional' | 'organizacion' | 'admin';


@Component({
  selector: 'app-mis-tickets',
  templateUrl: './mis-tickets.page.html',
  styleUrls: ['./mis-tickets.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,
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
    IonNote, 
    IonSpinner,
    IonAlert]
})
export class MisTicketsPage implements OnInit {
  tickets: SupportTicket[] = [];
  loading = true;
  error: string | null = null;
  private sub?: Subscription;

  role: Role = 'paciente';
  base = '/tabs';
  backHref = '/tabs/home';

  private routerSub?: Subscription;

  constructor(private soporteService: SoporteService, 
    private router: Router, 
    private location: Location,) { }

  ngOnInit() {
    this.resolveRoleAndBack();
    this.loadTickets();

    // Evita focus atrapado al navegar hacia atrás / entre outlets
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

  // Detecta rol y construye el home correcto (/tabs/home o /pro/home)
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

  onBackClick() {
    // defensa para accesibilidad y evitar focos en páginas ocultas
    (document.activeElement as HTMLElement | null)?.blur?.();
  }

  loadTickets() {
    this.loading = true;
    this.error = null;
    this.sub = this.soporteService.getTicketsByUser().subscribe({
      next: (data) => {
        // Ordenar del más reciente al más antiguo
        this.tickets = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar tickets:', err);
        this.error = 'No se pudieron cargar tus tickets. Inténtalo más tarde.';
        this.loading = false;
      }
    });
  }

  // Función para asignar estilos basados en el status
  getStatusColor(status: SupportTicket['status']): string {
    switch (status) {
      case 'cerrado':
        return 'success';
      case 'en_proceso':
        return 'warning';
      case 'abierto':
      default:
        return 'medium';
    }
  }

  // Función para obtener el ícono basado en el status
  getStatusIcon(status: SupportTicket['status']): string {
    switch (status) {
      case 'cerrado':
        return 'checkmark-circle-outline';
      case 'en_proceso':
        return 'hourglass-outline';
      case 'abierto':
      default:
        return 'help-circle-outline';
    }
  }

  // Función para truncar el mensaje y usarlo como resumen
  getSummary(message: string): string {
    return message.length > 50 ? message.substring(0, 47) + '...' : message;
  }

}
