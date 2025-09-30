from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

from django.utils import timezone
from datetime import timedelta

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('paciente', 'Paciente'),
        ('profesional', 'Profesional'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='paciente')
    specialty = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
    

User = settings.AUTH_USER_MODEL

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='appointments_as_patient', on_delete=models.CASCADE)
    professional = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='appointments_as_professional', on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=50)  # duración por defecto 50 min
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['professional', 'start_datetime']),
        ]

    @property
    def end_datetime(self):
        return self.start_datetime + timedelta(minutes=self.duration_minutes)

    def __str__(self):
        return f"{self.patient} with {self.professional} @ {self.start_datetime.isoformat()} ({self.status})"
