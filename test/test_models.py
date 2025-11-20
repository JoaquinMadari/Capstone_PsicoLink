from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from api.models import Appointment, PsicologoProfile, PacienteProfile, OrganizacionProfile, Specialty
from datetime import timedelta

User = get_user_model()

class CustomUserModelTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            email="testuser@example.com",
            password="Passw0rd!",
            first_name="Test",
            last_name="User"
        )
        self.assertIsNotNone(user.pk)
        self.assertTrue(user.check_password("Passw0rd!"))
        self.assertEqual(user.email, "testuser@example.com")

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="AdminPass123"
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

class AppointmentModelTestCase(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(email='p2@test.com', password='pass', role='paciente')
        self.professional = User.objects.create_user(email='prof2@test.com', password='pass', role='profesional')

    def test_valid_appointment(self):
        start = timezone.now() + timedelta(hours=1)
        app = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=start,
            duration_minutes=50,
            professional_role='psiquiatria'
        )
        self.assertEqual(app.status, 'scheduled')
        # Verifica que end_datetime se calculó bien
        self.assertEqual(app.end_datetime, start + timedelta(minutes=50))

    def test_appointment_in_past_fails(self):
        """No se debe permitir crear citas en el pasado"""
        past = timezone.now() - timedelta(days=1)
        appointment = Appointment(
            patient=self.patient,
            professional=self.professional,
            start_datetime=past,
            duration_minutes=50
        )
        with self.assertRaises(ValidationError):
            appointment.full_clean()

    def test_negative_duration_fails(self):
        """La duración no puede ser negativa"""
        start = timezone.now() + timedelta(hours=1)
        appointment = Appointment(
            patient=self.patient,
            professional=self.professional,
            start_datetime=start,
            duration_minutes=-10
        )
        with self.assertRaises(ValidationError):
            appointment.full_clean()