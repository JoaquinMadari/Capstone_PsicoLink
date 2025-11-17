import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SoporteService, SupportTicket } from 'src/app/services/soporte';
import { 
  IonContent, 
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
  IonButton, 
  IonSpinner,
  ToastController,
  IonBackButton,
  IonButtons,
  IonNote
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.page.html',
  styleUrls: ['./tickets.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, IonItem, IonLabel, IonTextarea, IonButton, IonSpinner, IonBackButton, IonButtons, IonNote]
})
export class TicketsPage implements OnInit {
  ticketId!: number;
  ticket: SupportTicket | null = null;
  loading = true;
  submitting = false;
  error: string | null = null;
  replyForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private soporteService: SoporteService,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.replyForm = this.fb.group({
      respuesta: ['', [Validators.required, Validators.minLength(10)]],
      // status: [null, [Validators.required]]
    });
  }

  ngOnInit() {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(this.ticketId)) {
      this.error = 'ID de ticket no válido.';
      this.loading = false;
      return;
    }
    this.loadTicketDetails();
  }

  loadTicketDetails() {
    this.loading = true;
    this.soporteService.getTicketDetailsForAdmin(this.ticketId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
        this.replyForm.patchValue({ respuesta: data.respuesta || '' });
      },
      error: (err) => {
        this.error = 'Error al cargar los detalles del ticket.';
        this.loading = false;
        console.error('Error loading ticket:', err);
      }
    });
  }

  async submitReply() {
    if (this.replyForm.invalid || this.submitting) {
      this.replyForm.markAllAsTouched();
      return;
    }
    
    this.submitting = true;
    const { respuesta } = this.replyForm.value;

    this.soporteService.replyToTicket(this.ticketId, { respuesta }).subscribe({
      next: async () => {
        await this.presentToast('Respuesta enviada y ticket actualizado con éxito.', 'success');
        this.submitting = false;
        this.router.navigate(['/admin/ticket-list']);
        this.loadTicketDetails();
      },
      error: async (err) => {
        this.submitting = false;
        await this.presentToast('Error al enviar la respuesta.', 'danger');
        console.error('Error submitting reply:', err);
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
  
  getStatusColor(status: SupportTicket['status']): string {
    switch (status) {
      case 'cerrado': return 'success';
      case 'en_proceso': return 'warning';
      case 'abierto': default: return 'medium';
    }
  }
}
