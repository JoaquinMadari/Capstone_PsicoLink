from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from api.models import CustomUser, PsicologoProfile, PacienteProfile, Appointment

User = get_user_model()

def try_reverse(name, fallback):
    try:
        return reverse(name)
    except:
        return fallback

class AuthViewsTests(APITestCase):

    def test_register_endpoint_creates_user(self):
        url = try_reverse("register", "/api/auth/register/")
        payload = {
            "email": "apiuser@example.com",
            "password": "SecretPass123",
            "first_name": "API",
            "last_name": "User",
            "role": "paciente"
        }
        resp = self.client.post(url, payload, format="json")
        self.assertIn(resp.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        self.assertTrue(User.objects.filter(email="apiuser@example.com").exists())
        self.assertIn("user", resp.data)
        self.assertEqual(resp.data["user"]["role"], "paciente")

    def test_login_returns_tokens(self):
        user = User.objects.create_user(username="loginuser", email="login@example.com", password="LoginPass123", role="paciente")
        url = try_reverse("login", "/api/auth/login/")
        resp = self.client.post(url, {"username": "loginuser", "password": "LoginPass123"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

class ProfileSetupViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(email="p1@test.com", password="pass", role="paciente")
        cls.professional = User.objects.create_user(email="prof@test.com", password="pass", role="profesional")

    def test_patient_profile_creation(self):
        self.client.force_authenticate(user=self.patient)
        payload = {"rut": "12345678-9", "age": 30, "gender": "Otro", "nationality": "Chileno", "phone": "123456789", "base_disease": "None"}
        url = try_reverse("profile-setup", "/api/profile/setup/")
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(PacienteProfile.objects.filter(user=self.patient).exists())

    def test_professional_profile_creation(self):
        self.client.force_authenticate(user=self.professional)
        payload = {"rut": "87654321-0", "age": 40, "gender": "M", "nationality": "Chileno", "phone": "987654321", "specialty": "Cognitivo", "license_number": "123", "main_focus": "Ansiedad", "therapeutic_techniques": "CBT", "style_of_attention": "Individual", "attention_schedule": "Lun-Vie", "work_modality": "Online", "certificates": "cert.pdf"}
        url = try_reverse("profile-setup", "/api/profile/setup/")
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(PsicologoProfile.objects.filter(user=self.professional).exists())

class AppointmentViewSetTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(email="p1@test.com", password="pass", role="paciente")
        cls.professional = User.objects.create_user(email="prof@test.com", password="pass", role="profesional")

    def setUp(self):
        self.client.force_authenticate(user=self.patient)

    def test_create_appointment(self):
        start = timezone.now() + timedelta(hours=1)
        url = try_reverse("appointment-list", "/api/appointments/")
        payload = {"professional": self.professional.id, "start_datetime": start, "duration_minutes": 50}
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["professional"], self.professional.id)

    def test_list_appointments_patient_only(self):
        start = timezone.now() + timedelta(hours=1)
        Appointment.objects.create(patient=self.patient, professional=self.professional, start_datetime=start, duration_minutes=50, professional_role="Cognitivo")
        url = try_reverse("appointment-list", "/api/appointments/")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

class ProfesionalSearchViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.prof = User.objects.create_user(username="profuser", email="prof@example.com", password="pass", role="profesional")
        PsicologoProfile.objects.create(user=cls.prof, rut="11111111-1", age=40, gender="M", nationality="Chileno", phone="12345678", specialty="Cognitivo", license_number="123", main_focus="Ansiedad", therapeutic_techniques="CBT", style_of_attention="Individual", attention_schedule="Lun-Vie", work_modality="Online", certificates="cert.pdf")

    def test_search_professional_by_specialty(self):
        url = try_reverse("professional-search", "/api/professionals/")
        resp = self.client.get(url, {"search": "Cognitivo"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["specialty"], "Cognitivo")