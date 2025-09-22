from django.db import models
from django.contrib.auth.models import AbstractUser

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
