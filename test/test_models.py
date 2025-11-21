from django.test import TestCase
from django.utils import timezone
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from api.models import (Appointment, PsicologoProfile, PacienteProfile, 
                       OrganizacionProfile, SupportTicket, AppointmentNote, Specialty)  # ✅ AGREGAR Specialty aquí

User = get_user_model()

# ----------------------------
# Tests para CustomUser (EXPANDIDOS)
# ----------------------------
class CustomUserModelTests(TestCase):
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'Passw0rd!',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_create_user(self):
        user = User.objects.create_user(**self.user_data)
        self.assertIsNotNone(user.pk)
        self.assertTrue(user.check_password("Passw0rd!"))
        self.assertEqual(user.email, "testuser@example.com")
        self.assertEqual(user.get_full_name(), "Test User")
        self.assertEqual(str(user), "testuser (paciente)")

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="AdminPass123"
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_unique_email(self):
        User.objects.create_user(username="u1", email="unique@test.com", password="pass")
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username="u2", email="unique@test.com", password="pass")

    def test_create_user_without_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(username="noemail", email="", password="pass")

    # NUEVAS PRUEBAS PARA USER
    def test_user_role_choices(self):
        """Test que verifica los roles disponibles"""
        user = User.objects.create_user(
            username="role_test",
            email="role@test.com",
            password="pass",
            role="profesional"
        )
        self.assertEqual(user.role, "profesional")
        
        # Verificar que no se puede asignar un rol inválido
        with self.assertRaises(ValidationError):
            user.role = "invalid_role"
            user.full_clean()

    def test_user_supabase_uid_unique(self):
        """Test para la unicidad del supabase_uid"""
        uid = "123e4567-e89b-12d3-a456-426614174000"
        User.objects.create_user(
            username="user1",
            email="user1@test.com",
            password="pass",
            supabase_uid=uid
        )
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username="user2",
                email="user2@test.com",
                password="pass",
                supabase_uid=uid
            )


# ----------------------------
# Tests para PsicologoProfile (EXPANDIDOS)
# ----------------------------
class PsicologoProfileTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='psicologo_test',
            email='psicologo@test.com',
            password='pass',
            role='profesional'
        )
        self.profile_data = {
            'user': self.user,
            'rut': '12345678-9',
            'age': 35,
            'gender': 'Femenino',
            'nationality': 'Chileno',
            'phone': '+56912345678',
            'specialty': 'psicologia_clinica',
            'license_number': 'PSI-12345',
            'main_focus': 'Ansiedad y Depresión',
            'therapeutic_techniques': 'TCC, Terapia Humanista',
            'style_of_attention': 'Individual y Grupal',
            'attention_schedule': 'Lunes a Viernes 9:00-18:00',
            'work_modality': 'Online',
            'certificates': ''  # En pruebas reales usarías SimpleUploadedFile
        }

    def test_create_psicologo_profile(self):
        profile = PsicologoProfile.objects.create(**self.profile_data)
        self.assertEqual(profile.specialty, 'psicologia_clinica')
        self.assertEqual(profile.cases_attended, 0)
        self.assertEqual(profile.rating, 0.00)

    def test_specialty_choices_validation(self):
        """Test que verifica las especialidades válidas"""
        valid_specialties = [choice[0] for choice in Specialty.choices]  # ✅ Ahora funciona
        
        profile = PsicologoProfile.objects.create(
            **self.profile_data,
            specialty='psiquiatria'  # Especialidad válida
        )
        self.assertIn(profile.specialty, valid_specialties)

    def test_psicologo_availability(self):
        """Test para la disponibilidad del psicólogo"""
        profile = PsicologoProfile.objects.create(**self.profile_data)
        self.assertTrue(profile.is_available)
        
        # Cambiar disponibilidad
        profile.is_available = False
        profile.save()
        self.assertFalse(profile.is_available)

    def test_session_price_validation(self):
        """Test para el precio de sesión"""
        profile = PsicologoProfile.objects.create(
            **self.profile_data,
            session_price=25000
        )
        self.assertEqual(profile.session_price, 25000)
        
        # Precio cero debería ser válido
        profile.session_price = 0
        profile.full_clean()

    def test_optional_fields_psicologo(self):
        """Test para campos opcionales del psicólogo"""
        profile = PsicologoProfile.objects.create(
            **self.profile_data,
            languages='Español, Inglés',
            experience_years=5,
            inclusive_orientation=True
        )
        self.assertEqual(profile.languages, 'Español, Inglés')
        self.assertEqual(profile.experience_years, 5)
        self.assertTrue(profile.inclusive_orientation)


# ----------------------------
# Tests para PacienteProfile (EXPANDIDOS)
# ----------------------------
class PacienteProfileTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='paciente_test',
            email='paciente@test.com',
            password='pass',
            role='paciente'
        )
        self.profile_data = {
            'user': self.user,
            'rut': '98765432-1',
            'age': 28,
            'gender': 'Masculino',
            'nationality': 'Chileno',
            'phone': '+56987654321',
            'base_disease': 'Trastorno de ansiedad',
            'disability': False
        }

    def test_create_paciente_profile(self):
        profile = PacienteProfile.objects.create(**self.profile_data)
        self.assertEqual(profile.base_disease, 'Trastorno de ansiedad')
        self.assertFalse(profile.disability)

    def test_paciente_optional_fields(self):
        """Test para campos opcionales del paciente"""
        profile = PacienteProfile.objects.create(
            **self.profile_data,
            description='Paciente con ansiedad generalizada',
            consultation_reason='Crisis de pánico',
            preference_modality='Online',
            preferred_focus='Terapia cognitivo-conductual',
            inclusive_orientation=True
        )
        self.assertEqual(profile.consultation_reason, 'Crisis de pánico')
        self.assertTrue(profile.inclusive_orientation)

    def test_paciente_with_disability(self):
        """Test para paciente con discapacidad"""
        # ✅ CORREGIDO: No pasar disability dos veces
        profile_data = self.profile_data.copy()
        profile_data['disability'] = True
        profile = PacienteProfile.objects.create(**profile_data)
        self.assertTrue(profile.disability)


# ----------------------------
# Tests para OrganizacionProfile (EXPANDIDOS)
# ----------------------------
class OrganizacionProfileTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='org_test',
            email='org@test.com',
            password='pass',
            role='organizacion'
        )

    def test_create_organizacion_profile(self):
        profile = OrganizacionProfile.objects.create(
            user=self.user,
            organization_name='Empresa Test S.A.',
            organization_rut='76.123.456-7',
            contact_email='contacto@empresatest.cl'
        )
        self.assertEqual(profile.organization_name, 'Empresa Test S.A.')
        self.assertEqual(profile.contact_email, 'contacto@empresatest.cl')

    def test_organizacion_optional_fields(self):
        """Test para campos opcionales de organización"""
        profile = OrganizacionProfile.objects.create(
            user=self.user,
            organization_name='Otra Empresa',
            organization_rut='65.987.654-3',
            contact_email='contacto@otraempresa.cl',
            contact_phone='+56223456789',
            num_employees=150,
            company_sector='Tecnología',
            location='Santiago, Chile',
            service_type_required='Psicología organizacional',
            preference_modality='Presencial',
            type_of_attention='Grupal',
            service_frequency='Semanal'
        )
        self.assertEqual(profile.num_employees, 150)
        self.assertEqual(profile.company_sector, 'Tecnología')


# ----------------------------
# Tests para Appointment (EXPANDIDOS)
# ----------------------------
class AppointmentTestCase(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            username='paciente_app',
            email='paciente@app.com',
            password='pass',
            role='paciente'
        )
        self.professional = User.objects.create_user(
            username='profesional_app',
            email='profesional@app.com',
            password='pass',
            role='profesional'
        )
        
        # Crear perfil de psicólogo para el profesional
        self.psicologo_profile = PsicologoProfile.objects.create(
            user=self.professional,
            rut='11111111-1',
            age=40,
            gender='Masculino',
            nationality='Chileno',
            phone='+56911111111',
            specialty='psicologia_clinica',
            license_number='PSI-54321',
            main_focus='Terapia de pareja',
            therapeutic_techniques='TCC',
            style_of_attention='Individual',
            attention_schedule='Lun-Vie 9-18',
            work_modality='Online',
            certificates=''
        )

        self.start_time = timezone.now() + timezone.timedelta(hours=2)

    def test_create_appointment(self):
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=self.start_time,
            duration_minutes=50
        )
        self.assertEqual(appointment.status, 'scheduled')
        self.assertEqual(appointment.professional_role, 'psicologia_clinica')  # Se asigna automáticamente
        self.assertEqual(appointment.end_datetime, self.start_time + timezone.timedelta(minutes=50))

    def test_appointment_modality_choices(self):
        """Test para modalidades de atención"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=self.start_time,
            duration_minutes=50,
            modality='Online'
        )
        self.assertEqual(appointment.modality, 'Online')
        
        appointment.modality = 'Presencial'
        appointment.save()
        self.assertEqual(appointment.modality, 'Presencial')

    def test_appointment_status_workflow(self):
        """Test para el flujo de estados de una cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=self.start_time,
            duration_minutes=50
        )
        self.assertEqual(appointment.status, 'scheduled')
        
        appointment.status = 'completed'
        appointment.save()
        self.assertEqual(appointment.status, 'completed')

    def test_appointment_zoom_integration(self):
        """Test para campos de integración con Zoom"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=self.start_time,
            duration_minutes=50,
            zoom_meeting_id='123456789',
            zoom_join_url='https://zoom.us/j/123456789',
            zoom_start_url='https://zoom.us/s/123456789'
        )
        self.assertEqual(appointment.zoom_meeting_id, '123456789')
        self.assertIsNotNone(appointment.zoom_join_url)

    def test_appointment_notes_relationship(self):
        """Test para la relación con notas de cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=self.start_time,
            duration_minutes=50
        )
        
        note = AppointmentNote.objects.create(
            appointment=appointment,
            text='Primera sesión de evaluación inicial'
        )
        
        self.assertEqual(appointment.historial.count(), 1)
        self.assertEqual(appointment.historial.first().text, 'Primera sesión de evaluación inicial')


# ----------------------------
# NUEVOS TESTS para SupportTicket
# ----------------------------
class SupportTicketTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='ticket_user',
            email='user@ticket.com',
            password='pass',
            role='paciente'
        )
        
        self.admin_user = User.objects.create_superuser(
            username='admin_ticket',
            email='admin@ticket.com',
            password='adminpass'
        )

    def test_create_support_ticket_authenticated(self):
        """Test para crear ticket con usuario autenticado"""
        ticket = SupportTicket.objects.create(
            user=self.user,
            name='Usuario Test',
            email='user@test.com',
            subject='Problema con la plataforma',
            message='No puedo acceder a mi cuenta'
        )
        self.assertEqual(ticket.status, 'abierto')
        self.assertEqual(ticket.user, self.user)
        self.assertEqual(ticket.subject, 'Problema con la plataforma')

    def test_create_support_ticket_anonymous(self):
        """Test para crear ticket sin usuario autenticado"""
        ticket = SupportTicket.objects.create(
            name='Anónimo',
            email='anon@test.com',
            message='Consulta general sobre servicios'
        )
        self.assertIsNone(ticket.user)
        self.assertEqual(ticket.status, 'abierto')

    def test_ticket_status_choices(self):
        """Test para los estados del ticket"""
        ticket = SupportTicket.objects.create(
            name='Test Status',
            email='status@test.com',
            message='Test'
        )
        
        # Probar cambio de estados
        ticket.status = 'en_proceso'
        ticket.save()
        self.assertEqual(ticket.status, 'en_proceso')
        
        ticket.status = 'cerrado'
        ticket.save()
        self.assertEqual(ticket.status, 'cerrado')

    def test_ticket_response_workflow(self):
        """Test para el flujo de respuesta de ticket"""
        ticket = SupportTicket.objects.create(
            user=self.user,
            name='Usuario',
            email='user@test.com',
            message='Necesito ayuda'
        )
        
        # Simular respuesta
        ticket.respuesta = 'Hemos solucionado tu problema'
        ticket.respondido_por = self.admin_user
        ticket.fecha_respuesta = timezone.now()
        ticket.status = 'cerrado'
        ticket.save()
        
        self.assertEqual(ticket.respuesta, 'Hemos solucionado tu problema')
        self.assertEqual(ticket.respondido_por, self.admin_user)
        self.assertEqual(ticket.status, 'cerrado')

    def test_ticket_ordering(self):
        """Test para verificar el ordenamiento de tickets"""
        ticket1 = SupportTicket.objects.create(
            name='Primero',
            email='first@test.com',
            message='Primer ticket'
        )
        
        ticket2 = SupportTicket.objects.create(
            name='Segundo',
            email='second@test.com',
            message='Segundo ticket'
        )
        
        tickets = SupportTicket.objects.all()
        self.assertEqual(tickets[0], ticket2)  # Orden descendente por created_at
        self.assertEqual(tickets[1], ticket1)


# ----------------------------
# Tests de Validación y Constraints
# ----------------------------
class ValidationTests(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            username='val_patient', email='val_patient@test.com', password='pass', role='paciente'
        )
        self.professional = User.objects.create_user(
            username='val_prof', email='val_prof@test.com', password='pass', role='profesional'
        )

    def test_appointment_past_date_validation(self):
        """Test que verifica que no se puedan crear citas en el pasado"""
        past_date = timezone.now() - timezone.timedelta(hours=1)
        
        appointment = Appointment(
            patient=self.patient,
            professional=self.professional,
            start_datetime=past_date,
            duration_minutes=50
        )
        
        with self.assertRaises(ValidationError):
            appointment.full_clean()

    def test_appointment_zero_duration_validation(self):
        """Test que verifica que la duración sea mayor a 0"""
        future_date = timezone.now() + timezone.timedelta(hours=1)
        
        appointment = Appointment(
            patient=self.patient,
            professional=self.professional,
            start_datetime=future_date,
            duration_minutes=0
        )
        
        with self.assertRaises(ValidationError):
            appointment.full_clean()

    def test_appointment_negative_duration_validation(self):
        """Test que verifica que la duración no sea negativa"""
        future_date = timezone.now() + timezone.timedelta(hours=1)
        
        appointment = Appointment(
            patient=self.patient,
            professional=self.professional,
            start_datetime=future_date,
            duration_minutes=-10
        )
        
        with self.assertRaises(ValidationError):
            appointment.full_clean()