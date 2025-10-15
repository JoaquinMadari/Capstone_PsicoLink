from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from rest_framework.exceptions import ValidationError

from api.serializers import (
    RegisterSerializer, UserSerializer,
    PsicologoProfileSerializer, PacienteProfileSerializer,
    OrganizacionProfileSerializer, AppointmentSerializer,
    ProfessionalSearchSerializer
)
from api.models import CustomUser, PsicologoProfile, PacienteProfile, OrganizacionProfile, Appointment

User = get_user_model()

class UserSerializersTests(TestCase):
    def test_user_serializer_serializes_basic_fields(self):
        user = User.objects.create_user(
            username="seruser", email="ser@example.com", password="Secret123"
        )
        data = UserSerializer(user).data
        self.assertIn("username", data)
        self.assertIn("email", data)
        self.assertEqual(data["username"], "seruser")

    def test_register_serializer_validation_and_create(self):
        payload = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123",
            "first_name": "New",
            "last_name": "User",
            "role": "paciente"
        }
        serializer = RegisterSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), msg=getattr(serializer, "errors", None))
        user = serializer.save()
        self.assertIsNotNone(user.pk)
        self.assertTrue(user.check_password(payload["password"]))

class ProfileSerializersTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient_user = User.objects.create_user(
            username='paciente1', email='p1@test.com', password='pass', role='paciente'
        )
        cls.professional_user = User.objects.create_user(
            username='prof1', email='prof1@test.com', password='pass', role='profesional'
        )
        cls.org_user = User.objects.create_user(
            username='org1', email='org1@test.com', password='pass', role='organizacion'
        )

    def test_psicologo_profile_serializer_create(self):
        payload = {
            "rut": "12345678-9", "age": 35, "gender": "Otro", "nationality": "Chileno", "phone": "123456789",
            "specialty": "Cognitivo", "license_number": "1234", "main_focus": "Ansiedad",
            "therapeutic_techniques": "CBT", "style_of_attention": "Individual", "attention_schedule": "Lun-Vie",
            "work_modality": "Online", "certificates": "cert.pdf", "experience_years": ""
        }
        serializer = PsicologoProfileSerializer(data=payload, context={"user": self.professional_user})
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        profile = serializer.save()
        self.assertEqual(profile.user, self.professional_user)
        self.assertIsNone(profile.experience_years)

    def test_paciente_profile_serializer_create(self):
        payload = {
            "rut": "87654321-0", "age": 30, "gender": "Otro", "nationality": "Chileno", "phone": "987654321",
            "base_disease": "None", "inclusive_orientation": False
        }
        serializer = PacienteProfileSerializer(data=payload, context={"user": self.patient_user})
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        profile = serializer.save()
        self.assertEqual(profile.user, self.patient_user)

    def test_organizacion_profile_serializer_create(self):
        payload = {
            "organization_name": "Org Test", "organization_rut": "123456789", "contact_email": "contact@org.com"
        }
        serializer = OrganizacionProfileSerializer(data=payload, context={"user": self.org_user})
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        profile = serializer.save()
        self.assertEqual(profile.user, self.org_user)

class AppointmentSerializerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(username='p2', email='p2@test.com', password='pass', role='paciente')
        cls.professional = User.objects.create_user(username='prof2', email='prof2@test.com', password='pass', role='profesional')

    def setUp(self):
        self.factory = RequestFactory()

    def test_create_valid_appointment(self):
        start = timezone.now() + timedelta(hours=1)
        request = self.factory.post('/')
        request.user = self.patient
        serializer = AppointmentSerializer(data={
            "professional": self.professional.id,
            "start_datetime": start,
            "duration_minutes": 50
        }, context={"request": request})
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        appointment = serializer.save()
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.professional, self.professional)
        self.assertEqual(appointment.end_datetime, start + timedelta(minutes=50))

class ProfessionalSearchSerializerTests(TestCase):
    def test_full_name_and_specialty_fields(self):
        prof_user = User.objects.create_user(username="profuser", email="prof@example.com", password="pass", role="profesional", first_name="Juan", last_name="Perez")
        PsicologoProfile.objects.create(user=prof_user, rut="11111111-1", age=40, gender="M", nationality="Chileno", phone="12345678", specialty="Cognitivo", license_number="123", main_focus="Ansiedad", therapeutic_techniques="CBT", style_of_attention="Individual", attention_schedule="Lun-Vie", work_modality="Online", certificates="cert.pdf")
        serializer = ProfessionalSearchSerializer(prof_user)
        data = serializer.data
        self.assertEqual(data["full_name"], "Juan Perez")
        self.assertEqual(data["specialty"], "Cognitivo")
