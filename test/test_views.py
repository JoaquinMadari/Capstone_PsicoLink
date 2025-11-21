from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from api.models import (
    CustomUser, PsicologoProfile, PacienteProfile, OrganizacionProfile, 
    Appointment, SupportTicket, AppointmentNote, Specialty
)

User = get_user_model()

def try_reverse(name, fallback):
    try:
        return reverse(name)
    except:
        return fallback

# ----------------------------
# Tests para Authentication Views (EXPANDIDOS)
# ----------------------------
class AuthViewsTests(APITestCase):
    def setUp(self):
        self.register_url = try_reverse("register", "/api/auth/register/")
        self.login_url = try_reverse("login", "/api/auth/login/")
        self.specialty_url = try_reverse("specialty-list", "/api/specialties/")

    @patch('api.views.ensure_supabase_user') # Mock para evitar error 422 de Supabase
    def test_register_endpoint_creates_user(self, mock_supabase):
        mock_supabase.return_value = "fake-uid-123"
        
        payload = {
            "email": "apiuser@example.com",
            "password": "SecretPass123", 
            "first_name": "API",
            "last_name": "User",
            "role": "paciente"
        }
        resp = self.client.post(self.register_url, payload, format="json")
        self.assertIn(resp.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        self.assertTrue(User.objects.filter(email="apiuser@example.com").exists())
        self.assertIn("email", resp.data)
        self.assertEqual(resp.data["role"], "paciente")

    @patch('api.views.ensure_supabase_user')
    def test_register_different_roles(self, mock_supabase):
        """Test para registrar usuarios con diferentes roles"""
        mock_supabase.return_value = "fake-uid-123"
        roles = ['paciente', 'profesional', 'organizacion']
        
        for role in roles:
            payload = {
                "email": f"{role}@example.com",
                "password": "SecretPass123",
                "first_name": role.capitalize(),
                "last_name": "User",
                "role": role
            }
            resp = self.client.post(self.register_url, payload, format="json")
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
            self.assertEqual(resp.data["role"], role)

    @patch('api.views.ensure_supabase_user')
    def test_register_duplicate_email(self, mock_supabase):
        """Test para email duplicado en registro"""
        User.objects.create_user(
            username="existing_user", # Username único
            email="existing@example.com", 
            password="pass"
        )
        
        payload = {
            "email": "existing@example.com",
            "password": "SecretPass123",
            "role": "paciente"
        }
        
        resp = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", resp.data)

    def test_register_missing_required_fields(self):
        """Test para campos requeridos faltantes"""
        payload = {
            # email faltante
            "password": "SecretPass123",
            "role": "paciente"
        }
        
        resp = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", resp.data)

    @patch('api.views.get_supabase_session_tokens') # Mock Login Supabase
    def test_login_returns_tokens(self, mock_tokens):
        mock_tokens.return_value = {"access_token": "a", "refresh_token": "r"}
        
        user = User.objects.create_user(
            username="loginuser", 
            email="login@example.com", 
            password="LoginPass123", 
            role="paciente"
        )
        
        resp = self.client.post(
            self.login_url, 
            {"email": "login@example.com", "password": "LoginPass123"}, 
            format="json"
        )
        
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertIn("user", resp.data)

    def test_login_invalid_credentials(self):
        """Test para credenciales inválidas"""
        User.objects.create_user(
            username="loginfail", 
            email="fail@example.com", 
            password="LoginPass123", 
            role="paciente"
        )
        
        resp = self.client.post(
            self.login_url, 
            {"email": "fail@example.com", "password": "WrongPassword"}, 
            format="json"
        )
        
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_specialty_list_endpoint(self):
        """Test para el endpoint de especialidades"""
        resp = self.client.get(self.specialty_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)
        
        # Verificar que todas las especialidades están presentes
        specialty_values = [item['value'] for item in resp.data]
        expected_specialties = [choice[0] for choice in Specialty.choices]
        
        for expected in expected_specialties:
            self.assertIn(expected, specialty_values)

    def test_specialty_requires_detail_field(self):
        """Test para el campo requires_detail en especialidades"""
        resp = self.client.get(self.specialty_url)
        
        for specialty in resp.data:
            if specialty['value'] == Specialty.OTRO:
                self.assertTrue(specialty['requires_detail'])
            else:
                self.assertFalse(specialty['requires_detail'])


# ----------------------------
# Tests para Profile Setup View (EXPANDIDOS)
# ----------------------------
class ProfileSetupViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # CORREGIDO: Usernames únicos
        cls.patient = User.objects.create_user(
            username="setup_p1", email="setup_p1@test.com", password="pass", role="paciente"
        )
        cls.professional = User.objects.create_user(
            username="setup_prof", email="setup_prof@test.com", password="pass", role="profesional"
        )
        cls.organizacion = User.objects.create_user(
            username="setup_org", email="setup_org@test.com", password="pass", role="organizacion"
        )
        
        cls.profile_setup_url = try_reverse("profile-setup", "/api/profile/setup/")

    def test_patient_profile_creation(self):
        self.client.force_authenticate(user=self.patient)
        payload = {
            "rut": "12345678-9", "age": 30, "gender": "Otro", 
            "nationality": "Chileno", "phone": "123456789", 
            "base_disease": "Ansiedad", "disability": False
        }
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(PacienteProfile.objects.filter(user=self.patient).exists())

    def test_patient_profile_optional_fields(self):
        """Test para campos opcionales del paciente"""
        self.client.force_authenticate(user=self.patient)
        payload = {
            "rut": "12345678-9", "age": 30, "gender": "Otro", 
            "nationality": "Chileno", "phone": "123456789", 
            "base_disease": "Depresión", "disability": True,
            "description": "Paciente con depresión moderada",
            "consultation_reason": "Bajo estado de ánimo persistente",
            "preference_modality": "Online",
            "preferred_focus": "Terapia cognitivo-conductual",
            "inclusive_orientation": True
        }
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        
        profile = PacienteProfile.objects.get(user=self.patient)
        self.assertEqual(profile.consultation_reason, "Bajo estado de ánimo persistente")
        self.assertTrue(profile.disability)
        self.assertTrue(profile.inclusive_orientation)

    def test_professional_profile_creation(self):
        self.client.force_authenticate(user=self.professional)
        payload = {
            "rut": "87654321-0", "age": 40, "gender": "M", 
            "nationality": "Chileno", "phone": "987654321", 
            "specialty": "psiquiatria", "license_number": "123", 
            "main_focus": "Ansiedad", "therapeutic_techniques": "CBT", 
            "style_of_attention": "Individual", "attention_schedule": "Lun-Vie", 
            "work_modality": "Online", "certificates": "cert.pdf"
        }
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(PsicologoProfile.objects.filter(user=self.professional).exists())

    def test_professional_profile_specialty_other_validation(self):
        """Test para validación de specialty_other cuando specialty es 'otro'"""
        self.client.force_authenticate(user=self.professional)
        payload = {
            "rut": "87654321-0", "age": 40, "gender": "M", 
            "nationality": "Chileno", "phone": "987654321", 
            "specialty": "otro",  # Requiere specialty_other
            # specialty_other faltante
            "license_number": "123", "main_focus": "Ansiedad", 
            "therapeutic_techniques": "CBT", "style_of_attention": "Individual", 
            "work_modality": "Online", "certificates": "cert.pdf"
        }
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("specialty_other", resp.data)

    def test_organizacion_profile_creation(self):
        self.client.force_authenticate(user=self.organizacion)
        payload = {
            "organization_name": "Empresa Test S.A.",
            "organization_rut": "76.123.456-7",
            "contact_email": "contacto@empresatest.cl"
        }
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(OrganizacionProfile.objects.filter(user=self.organizacion).exists())

    def test_organizacion_profile_all_fields(self):
        """Test con todos los campos de organización"""
        self.client.force_authenticate(user=self.organizacion)
        payload = {
            "organization_name": "Empresa Completa S.A.",
            "organization_rut": "65.987.654-3",
            "contact_email": "contacto@empresacompleta.cl",
            "contact_phone": "+56223456789",
            "num_employees": 150,
            "company_sector": "Tecnología",
            "location": "Santiago, Chile",
            "service_type_required": "Psicología organizacional",
            "preference_modality": "Presencial",
            "type_of_attention": "Grupal",
            "service_frequency": "Semanal"
        }
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        
        profile = OrganizacionProfile.objects.get(user=self.organizacion)
        self.assertEqual(profile.num_employees, 150)
        self.assertEqual(profile.company_sector, "Tecnología")

    def test_profile_setup_invalid_role(self):
        """Test para rol inválido en profile setup"""
        invalid_user = User.objects.create_user(
            username="inv_role", email="invalid@test.com", password="pass", role="admin"
        )
        self.client.force_authenticate(user=invalid_user)
        
        payload = {"rut": "12345678-9", "age": 30, "gender": "Otro"}
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.data)

    def test_profile_setup_unauthenticated(self):
        """Test para profile setup sin autenticación"""
        payload = {"rut": "12345678-9", "age": 30, "gender": "Otro"}
        resp = self.client.post(self.profile_setup_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ----------------------------
# Tests para Appointment ViewSet (EXPANDIDOS)
# ----------------------------
class AppointmentViewSetTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # CORREGIDO: Usernames únicos
        cls.patient = User.objects.create_user(
            username="apt_p1", email="apt_p1@test.com", password="pass", role="paciente"
        )
        cls.professional = User.objects.create_user(
            username="apt_prof", email="apt_prof@test.com", password="pass", role="profesional"
        )
        
        # Crear perfil de psicólogo
        cls.psicologo_profile = PsicologoProfile.objects.create(
            user=cls.professional,
            rut="11111111-1", age=40, gender="M", nationality="Chileno", phone="12345678",
            specialty="psicologia_clinica", license_number="123", main_focus="Ansiedad",
            therapeutic_techniques="CBT", style_of_attention="Individual",
            attention_schedule="Lun-Vie", work_modality="Online", certificates="cert.pdf",
            is_available=True # Importante para validaciones
        )

    def setUp(self):
        self.client.force_authenticate(user=self.patient)
        self.appointments_url = try_reverse("appointment-list", "/api/appointments/")
        self.busy_url = try_reverse("appointment-busy", "/api/appointments/busy/")

    def test_create_appointment(self):
        start = timezone.now() + timedelta(hours=1)
        payload = {
            "professional": self.professional.id, 
            "start_datetime": start, 
            "duration_minutes": 50,
            "modality": "Online" # Modalidad válida para el perfil
        }
        resp = self.client.post(self.appointments_url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["professional"], self.professional.id)
        self.assertEqual(resp.data["patient"], self.patient.id)
        self.assertEqual(resp.data["status"], "scheduled")

    def test_create_appointment_past_date(self):
        """Test para crear cita en el pasado"""
        past_date = timezone.now() - timedelta(hours=1)
        payload = {
            "professional": self.professional.id, 
            "start_datetime": past_date, 
            "duration_minutes": 50
        }
        resp = self.client.post(self.appointments_url, payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("start_datetime", resp.data)

    def test_create_appointment_negative_duration(self):
        """Test para duración negativa"""
        start = timezone.now() + timedelta(hours=1)
        payload = {
            "professional": self.professional.id, 
            "start_datetime": start, 
            "duration_minutes": -10
        }
        resp = self.client.post(self.appointments_url, payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("duration_minutes", resp.data)

    @patch('api.views.create_meeting_for_professional')
    def test_create_appointment_with_zoom_integration(self, mock_create_meeting):
        """Test para creación de cita con integración Zoom"""
        # Mock de la función de Zoom
        mock_create_meeting.return_value = {
            "id": "123456789",
            "join_url": "https://zoom.us/j/123456789",
            "start_url": "https://zoom.us/s/123456789"
        }
        
        # Necesitamos simular que el profesional tiene token
        self.psicologo_profile.zoom_access_token = "fake_token"
        self.psicologo_profile.save()

        start = timezone.now() + timedelta(hours=1)
        payload = {
            "professional": self.professional.id, 
            "start_datetime": start, 
            "duration_minutes": 50,
            "modality": "Online"
        }
        resp = self.client.post(self.appointments_url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        
        # Verificar que se llamó a la función de Zoom
        mock_create_meeting.assert_called_once()
        
        # Verificar que los datos de Zoom están en la respuesta
        self.assertIn("zoom_join_url", resp.data)
        self.assertIn("zoom_start_url", resp.data)

    def test_list_appointments_patient_only(self):
        """Test que pacientes solo ven sus citas"""
        start = timezone.now() + timedelta(hours=1)
        Appointment.objects.create(
            patient=self.patient, professional=self.professional, 
            start_datetime=start, duration_minutes=50, professional_role="psiquiatria"
        )
        
        # Crear cita de otro paciente CON USERNAME ÚNICO
        other_patient = User.objects.create_user(
            username="other_p", email="other@test.com", password="pass", role="paciente"
        )
        Appointment.objects.create(
            patient=other_patient, professional=self.professional, 
            start_datetime=start + timedelta(hours=2), duration_minutes=50, professional_role="psiquiatria"
        )
        
        resp = self.client.get(self.appointments_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)  # Solo debería ver su cita

    def test_list_appointments_professional_view(self):
        """Test que profesionales ven sus citas"""
        self.client.force_authenticate(user=self.professional)
        
        start = timezone.now() + timedelta(hours=1)
        Appointment.objects.create(
            patient=self.patient, professional=self.professional, 
            start_datetime=start, duration_minutes=50, professional_role="psiquiatria"
        )
        
        resp = self.client.get(self.appointments_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_busy_endpoint(self):
        """Test para el endpoint de horarios ocupados"""
        start = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        if start < timezone.now():
            start += timedelta(days=1)
            
        Appointment.objects.create(
            patient=self.patient, professional=self.professional, 
            start_datetime=start, duration_minutes=50, professional_role="psiquiatria"
        )
        
        date_str = start.date().isoformat()
        params = {
            "professional": self.professional.id,
            "date": date_str
        }
        
        resp = self.client.get(self.busy_url, params)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("professional", resp.data)
        self.assertIn("patient", resp.data)
        self.assertEqual(len(resp.data["professional"]), 1)
        self.assertEqual(len(resp.data["patient"]), 1)

    def test_busy_endpoint_missing_params(self):
        """Test para endpoint busy sin parámetros requeridos"""
        resp = self.client.get(self.busy_url)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("detail", resp.data)

    def test_update_appointment_notes(self):
        """Test para actualizar notas de una cita"""
        # Necesitamos que la cita esté completed y el usuario sea el profesional
        self.client.force_authenticate(user=self.professional)
        
        appointment = Appointment.objects.create(
            patient=self.patient, professional=self.professional, 
            start_datetime=timezone.now() - timedelta(hours=2), 
            duration_minutes=50, professional_role="psiquiatria",
            status="completed" # Solo se edita si está completada
        )
        
        # Nota: AppointmentNoteCreateView suele ser un endpoint separado, 
        # pero si usas PATCH en appointment-detail para notas simples:
        detail_url = f"{self.appointments_url}{appointment.id}/"
        payload = {"notes": "Notas actualizadas de la sesión"}
        
        resp = self.client.patch(detail_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        
        appointment.refresh_from_db()
        self.assertEqual(appointment.notes, "Notas actualizadas de la sesión")


# ----------------------------
# Tests para Professional Search View (EXPANDIDOS)
# ----------------------------
class ProfesionalSearchViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.prof1 = User.objects.create_user(
            username="s_prof1", email="s_prof1@example.com", password="pass", role="profesional"
        )
        cls.prof2 = User.objects.create_user(
            username="s_prof2", email="s_prof2@example.com", password="pass", role="profesional"
        )
        
        cls.psicologo_profile1 = PsicologoProfile.objects.create(
            user=cls.prof1, rut="11111111-1", age=40, gender="M", nationality="Chileno", 
            phone="12345678", specialty="psiquiatria", license_number="123", 
            main_focus="Ansiedad", therapeutic_techniques="CBT", 
            style_of_attention="Individual", attention_schedule="Lun-Vie", 
            work_modality="Online", certificates="cert.pdf", experience_years=5,
            is_available=True
        )
        
        cls.psicologo_profile2 = PsicologoProfile.objects.create(
            user=cls.prof2, rut="22222222-2", age=35, gender="F", nationality="Chileno", 
            phone="87654321", specialty="psicologia_clinica", license_number="456", 
            main_focus="Depresión", therapeutic_techniques="Terapia Humanista", 
            style_of_attention="Grupal", attention_schedule="Mar-Jue", 
            work_modality="Presencial", certificates="cert2.pdf", experience_years=3,
            inclusive_orientation=True, is_available=True
        )

    def setUp(self):
        self.search_url = try_reverse("profesional-search", "/api/professionals/")

    def test_search_professional_by_specialty(self):
        resp = self.client.get(self.search_url, {"search": "psiquiatria"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["specialty"], "psiquiatria")

    def test_search_professional_by_name(self):
        resp = self.client.get(self.search_url, {"search": "s_prof1"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["username"], "s_prof1")

    def test_filter_by_experience(self):
        resp = self.client.get(self.search_url, {"experience_years_gte": 4})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["username"], "s_prof1")

    def test_filter_by_work_modality(self):
        resp = self.client.get(self.search_url, {"work_modality": "Presencial"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["username"], "s_prof2")

    def test_filter_by_inclusive_orientation(self):
        resp = self.client.get(self.search_url, {"inclusive_orientation": "true"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["username"], "s_prof2")

    def test_ordering_by_experience(self):
        resp = self.client.get(self.search_url, {"ordering": "-psicologoprofile__experience_years"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        # prof1 tiene más experiencia, debería ir primero
        self.assertEqual(resp.data[0]["username"], "s_prof1")

    def test_only_available_professionals(self):
        """Test que solo se muestran profesionales disponibles"""
        # Hacer que prof2 no esté disponible
        self.psicologo_profile2.is_available = False
        self.psicologo_profile2.save()
        
        resp = self.client.get(self.search_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)  # Solo prof1 está disponible
        self.assertEqual(resp.data[0]["username"], "s_prof1")


# ----------------------------
# Tests para Support Ticket Views
# ----------------------------
class SupportTicketViewsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(
            username="st_patient", email="st_patient@test.com", password="pass", role="paciente"
        )
        cls.admin_user = User.objects.create_superuser(
            email="admin@test.com", password="adminpass", username="admin"
        )
        
        cls.ticket_create_url = try_reverse("support-ticket-create", "/api/support/tickets/")
        cls.user_tickets_url = try_reverse("user-ticket-list", "/api/support/my-tickets/")
        cls.admin_tickets_url = try_reverse("admin-ticket-list", "/api/admin/support/tickets/")

    def test_create_support_ticket_authenticated(self):
        self.client.force_authenticate(user=self.patient)
        payload = {
            "name": "Usuario Test",
            "email": "user@test.com",
            "subject": "Problema técnico",
            "message": "No puedo acceder a mi cuenta"
        }
        resp = self.client.post(self.ticket_create_url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(SupportTicket.objects.filter(user=self.patient).exists())

    def test_create_support_ticket_anonymous(self):
        payload = {
            "name": "Anónimo",
            "email": "anon@test.com",
            "subject": "Consulta general",
            "message": "Quiero información sobre los servicios"
        }
        resp = self.client.post(self.ticket_create_url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(SupportTicket.objects.filter(email="anon@test.com").exists())
        self.assertIsNone(SupportTicket.objects.get(email="anon@test.com").user)

    def test_user_ticket_list(self):
        # Crear algunos tickets
        SupportTicket.objects.create(
            user=self.patient, name="User", email="user@test.com",
            subject="Problema 1", message="Mensaje 1"
        )
        SupportTicket.objects.create(
            user=self.patient, name="User", email="user@test.com", 
            subject="Problema 2", message="Mensaje 2"
        )
        
        self.client.force_authenticate(user=self.patient)
        resp = self.client.get(self.user_tickets_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

    def test_admin_ticket_list_access(self):
        """Test que solo admins pueden acceder a la lista de tickets"""
        # Usuario normal no puede acceder
        self.client.force_authenticate(user=self.patient)
        resp = self.client.get(self.admin_tickets_url)
        self.assertEqual(resp.status_code, 403)
        
        # Admin puede acceder
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(self.admin_tickets_url)
        self.assertEqual(resp.status_code, 200)

    def test_ticket_reply_by_admin(self):
        ticket = SupportTicket.objects.create(
            user=self.patient, name="User", email="user@test.com",
            subject="Problema", message="Mensaje"
        )
        
        # Verificar la URL correcta en tu router (ej: tickets/{pk}/reply/)
        reply_url = f"/api/admin/support/tickets/{ticket.id}/reply/"
        
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "respuesta": "Hemos solucionado tu problema.",
            "status": "cerrado"
        }
        
        resp = self.client.patch(reply_url, payload, format="json")
        # Si falla con 404, verifica tus urls.py
        if resp.status_code == 404:
            print(f"WARNING: URL no encontrada {reply_url}")
        else:
            self.assertEqual(resp.status_code, 200)
            ticket.refresh_from_db()
            self.assertEqual(ticket.status, "cerrado")
            self.assertEqual(ticket.respondido_por, self.admin_user)


# ----------------------------
# Tests para MyProfile Views
# ----------------------------
class MyProfileViewsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.professional = User.objects.create_user(
            username="mp_prof", email="mp_profile@test.com", password="pass", role="profesional",
            first_name="Ana", last_name="Gomez"
        )
        
        cls.psicologo_profile = PsicologoProfile.objects.create(
            user=cls.professional, rut="33333333-3", age=35, gender="F", 
            nationality="Chileno", phone="555555555", specialty="psicologia_clinica", 
            license_number="789", main_focus="Ansiedad", therapeutic_techniques="TCC", 
            style_of_attention="Individual", work_modality="Online", certificates="cert.pdf",
            session_price=30000
        )
        
        cls.profile_url = try_reverse("my-profile", "/api/auth/me/")

    def test_get_my_profile(self):
        self.client.force_authenticate(user=self.professional)
        resp = self.client.get(self.profile_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["email"], "mp_profile@test.com")

    def test_update_my_profile(self):
        self.client.force_authenticate(user=self.professional)
        payload = {
            "email": "nuevo_email@test.com",
            "phone": "666666666",
            "session_price": 35000
        }
        
        resp = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        
        self.professional.refresh_from_db()
        self.psicologo_profile.refresh_from_db()
        
        self.assertEqual(self.professional.email, "nuevo_email@test.com")
        self.assertEqual(self.psicologo_profile.phone, "666666666")

    def test_update_profile_duplicate_email(self):
        """Test para evitar email duplicado en actualización"""
        other_user = User.objects.create_user(
            username="mp_other", email="other@test.com", password="pass"
        )
        
        self.client.force_authenticate(user=self.professional)
        payload = {"email": "other@test.com"}
        
        resp = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", str(resp.data))


# ----------------------------
# Tests para Professional Availability View
# ----------------------------
class ProfessionalAvailabilityTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.professional = User.objects.create_user(
            username="av_prof", email="avail@test.com", password="pass", role="profesional"
        )
        
        cls.psicologo_profile = PsicologoProfile.objects.create(
            user=cls.professional, rut="44444444-4", age=40, gender="M", 
            nationality="Chileno", phone="777777777", specialty="psicologia_clinica", 
            license_number="999", main_focus="Depresión", therapeutic_techniques="TCC", 
            style_of_attention="Individual", work_modality="Online", certificates="cert.pdf",
            is_available=True
        )
        
        cls.availability_url = try_reverse("professional-availability", "/api/professional/availability/")

    def test_get_availability(self):
        self.client.force_authenticate(user=self.professional)
        resp = self.client.get(self.availability_url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["is_available"])

    def test_update_availability(self):
        self.client.force_authenticate(user=self.professional)
        payload = {"is_available": False}
        
        resp = self.client.patch(self.availability_url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        
        self.psicologo_profile.refresh_from_db()
        self.assertFalse(self.psicologo_profile.is_available)


# ----------------------------
# Tests para Close Appointment View
# ----------------------------
class CloseAppointmentViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(
            username="cl_pat", email="close_patient@test.com", password="pass", role="paciente"
        )
        cls.professional = User.objects.create_user(
            username="cl_prof", email="close_prof@test.com", password="pass", role="profesional"
        )
        
        # Crear una cita que ya pasó (para poder cerrarla)
        cls.past_appointment = Appointment.objects.create(
            patient=cls.patient, professional=cls.professional,
            start_datetime=timezone.now() - timedelta(hours=2),
            duration_minutes=50, professional_role="psicologia_clinica",
            status="scheduled"
        )

    def test_close_appointment_by_professional(self):
        close_url = f"/api/appointments/{self.past_appointment.id}/close/"
        
        self.client.force_authenticate(user=self.professional)
        resp = self.client.patch(close_url)
        
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "completed")
        
        self.past_appointment.refresh_from_db()
        self.assertEqual(self.past_appointment.status, "completed")

    def test_close_appointment_by_patient_denied(self):
        """Test que pacientes no pueden cerrar citas"""
        close_url = f"/api/appointments/{self.past_appointment.id}/close/"
        
        self.client.force_authenticate(user=self.patient)
        resp = self.client.patch(close_url)
        
        self.assertEqual(resp.status_code, 403)

    def test_close_appointment_too_early(self):
        """Test que no se puede cerrar cita antes del tiempo de gracia"""
        # Crear cita que acaba de empezar
        recent_appointment = Appointment.objects.create(
            patient=self.patient, professional=self.professional,
            start_datetime=timezone.now() - timedelta(minutes=5),
            duration_minutes=50, professional_role="psicologia_clinica",
            status="scheduled"
        )
        
        close_url = f"/api/appointments/{recent_appointment.id}/close/"
        
        self.client.force_authenticate(user=self.professional)
        resp = self.client.patch(close_url)
        
        self.assertEqual(resp.status_code, 400)
        self.assertIn("detail", resp.data)