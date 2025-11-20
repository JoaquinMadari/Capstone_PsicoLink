from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from api.serializers import (
    RegisterSerializer, UserSerializer, PsicologoProfileSerializer, AppointmentSerializer
)
from api.models import PsicologoProfile, Specialty

User = get_user_model()

class SerializerTests(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(email='p1@test.com', password='pass', role='paciente')
        self.professional = User.objects.create_user(email='prof1@test.com', password='pass', role='profesional')
        
        # Perfil necesario para validar reglas de negocio (ej. modalidad online)
        PsicologoProfile.objects.create(
            user=self.professional, rut="1-9", age=30, gender="X", nationality="CL", phone="1",
            specialty=Specialty.PSICOLOGIA_CLINICA, work_modality="Online", is_available=True
        )

    def test_register_serializer(self):
        data = {
            "email": "new@example.com",
            "password": "StrongPass123",
            "first_name": "New",
            "last_name": "User",
            "role": "paciente"
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.email, "new@example.com")

    def test_appointment_serializer_valid(self):
        """Caso de éxito creando una cita"""
        start = timezone.now() + timedelta(days=1)
        data = {
            "patient": self.patient.id,
            "professional": self.professional.id,
            "start_datetime": start,
            "duration_minutes": 50,
            "modality": "Online" # Coincide con el perfil del psicólogo
        }
        # Simulamos el contexto del request
        context = {'request': None}
        serializer = AppointmentSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_appointment_serializer_invalid_modality(self):
        """Falla si pides Presencial a un psicólogo Online"""
        start = timezone.now() + timedelta(days=1)
        data = {
            "patient": self.patient.id,
            "professional": self.professional.id,
            "start_datetime": start,
            "duration_minutes": 50,
            "modality": "Presencial" # El perfil es Online
        }
        serializer = AppointmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('modality', serializer.errors)