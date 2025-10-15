from django.test import TestCase
from django.utils import timezone
from django.db.utils import IntegrityError
from django.contrib.auth import get_user_model
from api.models import Appointment, PsicologoProfile, PacienteProfile, OrganizacionProfile

User = get_user_model()

# ----------------------------
# Tests para CustomUser
# ----------------------------
class CustomUserModelTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="Passw0rd!",
            first_name="Test",
            last_name="User"
        )
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
            User.objects.create_user(username="noemail", email=None, password="pass")


# ----------------------------
# Tests para perfiles
# ----------------------------
class ProfilesTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient_user = User.objects.create_user(username='paciente1', email='p1@test.com', password='pass', role='paciente')
        cls.professional_user = User.objects.create_user(username='prof1', email='prof1@test.com', password='pass', role='profesional')
        cls.org_user = User.objects.create_user(username='org1', email='org1@test.com', password='pass', role='organizacion')

    def test_create_profiles(self):
        paciente = PacienteProfile.objects.create(user=self.patient_user, rut='12345678-9', age=30, gender='Otro', nationality='Chileno', phone='123456789', base_disease='None')
        profesional = PsicologoProfile.objects.create(user=self.professional_user, rut='87654321-0', age=40, gender='Otro', nationality='Chileno', phone='987654321', specialty='Cognitivo', license_number='1234', main_focus='Ansiedad', therapeutic_techniques='CBT', style_of_attention='Individual', attention_schedule='Lun-Vie', work_modality='Online', certificates='cert.pdf')
        organizacion = OrganizacionProfile.objects.create(user=self.org_user, organization_name='Org Test', organization_rut='123456789', contact_email='contact@org.com')

        self.assertTrue(PacienteProfile.objects.filter(user=self.patient_user).exists())
        self.assertTrue(PsicologoProfile.objects.filter(user=self.professional_user).exists())
        self.assertTrue(OrganizacionProfile.objects.filter(user=self.org_user).exists())

    def test_optional_fields(self):
        prof = PsicologoProfile.objects.create(
            user=self.professional_user,
            rut='00000000-0',
            age=35,
            gender='Otro',
            nationality='Chileno',
            phone='111111111',
            specialty='Neuro',
            license_number='0001',
            main_focus='Stress',
            therapeutic_techniques='CBT',
            style_of_attention='Individual',
            attention_schedule='Lun-Vie',
            work_modality='Online',
            certificates='',
            languages='English',
            experience_years=None,
            curriculum_vitae=''
        )
        self.assertIsNone(prof.experience_years)
        self.assertEqual(prof.languages, 'English')

    def test_one_to_one_constraint(self):
        PsicologoProfile.objects.create(
            user=self.professional_user,
            rut='00000000-0',
            age=35,
            gender='Otro',
            nationality='Chileno',
            phone='111111111',
            specialty='Neuro',
            license_number='0001',
            main_focus='Stress',
            therapeutic_techniques='CBT',
            style_of_attention='Individual',
            attention_schedule='Lun-Vie',
            work_modality='Online',
            certificates='cert.pdf'
        )
        with self.assertRaises(IntegrityError):
            PsicologoProfile.objects.create(
                user=self.professional_user,
                rut='00000001-1',
                age=36,
                gender='Otro',
                nationality='Chileno',
                phone='222222222',
                specialty='Neuro',
                license_number='0002',
                main_focus='Anxiety',
                therapeutic_techniques='CBT',
                style_of_attention='Individual',
                attention_schedule='Lun-Vie',
                work_modality='Online',
                certificates='cert2.pdf'
            )


# ----------------------------
# Tests para Appointment
# ----------------------------
class AppointmentTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(username='p2', email='p2@test.com', password='pass', role='paciente')
        cls.professional = User.objects.create_user(username='prof2', email='prof2@test.com', password='pass', role='profesional')

    def test_create_appointment(self):
        start = timezone.now() + timezone.timedelta(hours=1)
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            start_datetime=start,
            duration_minutes=50,
            professional_role='Cognitivo'
        )
        self.assertEqual(appointment.status, 'scheduled')
        self.assertEqual(appointment.professional_role, 'Cognitivo')
        self.assertEqual(appointment.end_datetime, start + timezone.timedelta(minutes=50))
        self.assertEqual(appointment.time_range, [start, start + timezone.timedelta(minutes=50)])

    def test_overlap_constraint(self):
        start = timezone.now() + timezone.timedelta(hours=1)
        end = start + timezone.timedelta(minutes=50)
        Appointment.objects.create(patient=self.patient, professional=self.professional, start_datetime=start, duration_minutes=50, time_range=[start, end])

        with self.assertRaises(IntegrityError):
            Appointment.objects.create(
                patient=self.patient,
                professional=self.professional,
                start_datetime=start + timezone.timedelta(minutes=25),
                duration_minutes=50,
                time_range=[start + timezone.timedelta(minutes=25), end + timezone.timedelta(minutes=25)]
            )

    def test_appointment_in_past(self):
        past = timezone.now() - timezone.timedelta(days=1)
        with self.assertRaises(Exception):
            Appointment.objects.create(
                patient=self.patient,
                professional=self.professional,
                start_datetime=past,
                duration_minutes=50,
                professional_role='Cognitivo'
            )

    def test_negative_duration(self):
        start = timezone.now() + timezone.timedelta(hours=1)
        with self.assertRaises(Exception):
            Appointment.objects.create(
                patient=self.patient,
                professional=self.professional,
                start_datetime=start,
                duration_minutes=-10,
                professional_role='Cognitivo'
            )
