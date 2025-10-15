from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

from django.contrib.postgres.fields import DateTimeRangeField
from django.contrib.postgres.constraints import ExclusionConstraint
from django.db.models import F
from datetime import timedelta

#-------------------------------------------------------------------
# ----- AQUI SE EMPIEZAN A DEFINIR LOS PERFILES DE LOS USUARIOS ----
#-------------------------------------------------------------------

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('paciente', 'Paciente'),
        ('profesional', 'Profesional'),
        ('organizacion', 'Organización'),
        ('admin', 'Administrador'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='paciente')
    email = models.EmailField(unique=True)

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.username} ({self.role})"
    
class BaseProfile(models.Model):
    # Campos comunes
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    rut = models.CharField(max_length=12)
    age = models.IntegerField()
    gender = models.CharField(max_length=50)
    nationality = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
        
    class Meta:
        abstract = True # No creará una tabla en la DB


class Specialty(models.TextChoices):
    PSIQUIATRIA = 'psiquiatria', 'Psiquiatría'
    PSICOLOGIA_CLINICA = 'psicologia_clinica', 'Psicología Clínica'
    INFANTO_JUVENIL = 'infanto_juvenil', 'Psicología Infantil y Adolescente'
    PAREJA_FAMILIA = 'pareja_familia', 'Terapia de Pareja y Familia'
    NEUROPSICOLOGIA = 'neuropsicologia', 'Neuropsicología'
    SEXOLOGIA = 'sexologia_clinica', 'Sexología Clínica'
    ADICCIONES = 'adicciones', 'Adicciones'
    GERONTO = 'gerontopsicologia', 'Psicología Geriátrica'
    SALUD = 'psicologia_salud', 'Psicología de la Salud'
    EVALUACION = 'evaluacion_psicologica', 'Evaluación/Peritaje Psicológico'
    EDUCATIVA = 'psicologia_educativa', 'Psicología Educativa'
    OTRO = 'otro', 'Otro'

class PsicologoProfile(BaseProfile):
    # Aquí van los campos OBLIGATORIOS y OPCIONALES del psicólogo
    specialty = models.CharField(
        max_length=50,
        choices=Specialty.choices,
        default=Specialty.PSICOLOGIA_CLINICA
    )
    specialty_other = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50)
    main_focus = models.CharField(max_length=100)
    therapeutic_techniques = models.TextField()
    style_of_attention = models.TextField()
    attention_schedule = models.CharField(max_length=255) # Mejor un JSONField o FK a un modelo de Horario
    work_modality = models.CharField(max_length=50)
    certificates = models.FileField(upload_to='certificates/')
    
    # Campos opcionales
    inclusive_orientation = models.BooleanField(default=False)
    languages = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.IntegerField(blank=True, null=True)
    curriculum_vitae = models.FileField(upload_to='cvs/', blank=True, null=True)
    
    # Campos No Editables (Mantenimiento interno)
    cases_attended = models.IntegerField(default=0, editable=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, editable=False)


class PacienteProfile(BaseProfile):
    # Aquí van los campos OBLIGATORIOS y OPCIONALES del paciente
    inclusive_orientation = models.BooleanField(default=False)
    base_disease = models.CharField(max_length=100)
    disability = models.BooleanField(default=False)
    
    # Campos Opcionales
    description = models.TextField(blank=True, null=True)
    consultation_reason = models.CharField(max_length=100, blank=True, null=True)
    preference_modality = models.CharField(max_length=50, blank=True, null=True)
    preferred_focus = models.CharField(max_length=100, blank=True, null=True)


class OrganizacionProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    
    # Campos Obligatorios
    organization_name = models.CharField(max_length=255)
    organization_rut = models.CharField(max_length=15)
    contact_email = models.EmailField()
    
    # Campos Opcionales
    contact_phone = models.CharField(max_length=15, blank=True, null=True)
    num_employees = models.IntegerField(blank=True, null=True)
    company_sector = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    service_type_required = models.CharField(max_length=100, blank=True, null=True)
    preference_modality = models.CharField(max_length=50, blank=True, null=True)
    type_of_attention = models.CharField(max_length=100, blank=True, null=True)
    service_frequency = models.CharField(max_length=100, blank=True, null=True)

#---------------------------------------------------
# --- AQUI TERMINAN LOS PERFILES DE LOS USUARIOS ---
#---------------------------------------------------

User = settings.AUTH_USER_MODEL

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='appointments_as_patient', on_delete=models.CASCADE
    )
    professional = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='appointments_as_professional', on_delete=models.CASCADE
    )
    professional_role = models.CharField(max_length=50, blank=True, null=True)
    start_datetime = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    time_range = DateTimeRangeField(null=True, blank=True)

    @property
    def end_datetime(self):
        return self.start_datetime + timedelta(minutes=self.duration_minutes)
    
    def save(self, *args, **kwargs):
        # Aseguramos que 'time_range' se calcule antes de guardar
        self.time_range = [self.start_datetime, self.end_datetime]
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['professional', 'start_datetime']),
        ]
        
        constraints = [
            ExclusionConstraint(
                name='appointment_prof_overlap',
                expressions=[
                    (F('time_range'), '&&'), # El operador '&&' verifica solapamiento en rangos
                    (F('professional'), '='), # La exclusión solo aplica si el 'professional' es el mismo
                ],
                condition=models.Q(status='scheduled') # Solo aplica a citas activas
            )
        ]

    def __str__(self):
        return f"{self.patient} with {self.professional} @ {self.start_datetime.isoformat()} ({self.status})"