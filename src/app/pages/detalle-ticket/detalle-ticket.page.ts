import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { Subscription } from 'rxjs';
import { IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonItem, 
  IonLabel, 
  IonTextarea,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonNote, } from '@ionic/angular/standalone';

@Component({
  selector: 'app-detalle-ticket',
  templateUrl: './detalle-ticket.page.html',
  styleUrls: ['./detalle-ticket.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonItem, 
    IonLabel, 
    IonTextarea,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonNote]
})
export class DetalleTicketPage implements OnInit {  
  ticketId: number | null = null;
  ticket: SupportTicket | null = null;
  loading = true;
  error: string | null = null;
  private sub?: Subscription;

  constructor(private route: ActivatedRoute, private soporteService: SoporteService) { }

  ngOnInit() {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.ticketId) {
      this.loadTicketDetails(this.ticketId);
    } else {
      this.error = 'ID de ticket no proporcionado.';
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadTicketDetails(id: number) {
    this.loading = true;
    this.error = null;
    this.sub = this.soporteService.getTicketDetails(id).subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle del ticket:', err);
        this.error = 'No se pudo cargar el detalle del ticket.';
        this.loading = false;
      }
    });
  }

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

  getStatusLabel(status: SupportTicket['status']): string {
    switch (status) {
      case 'cerrado':
        return 'Resuelto';
      case 'en_proceso':
        return 'En Progreso';
      case 'abierto':
      default:
        return 'Abierto';
    }
  }
}

