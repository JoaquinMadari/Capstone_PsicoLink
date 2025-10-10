from django.test import TestCase
from django.utils import timezone
from django.db.utils import IntegrityError
from django.contrib.auth import get_user_model
from api.models import Appointment, PsicologoProfile, PacienteProfile, OrganizacionProfile

User = get_user_model()

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

    def test_overlap_constraint(self):
        start = timezone.now() + timezone.timedelta(hours=1)
        end = start + timezone.timedelta(minutes=50)
        Appointment.objects.create(patient=self.patient, professional=self.professional, start_datetime=start, duration_minutes=50, time_range=(start, end))

        # Intentar crear una cita solapada debe lanzar error de integridad
        with self.assertRaises(IntegrityError):
            Appointment.objects.create(patient=self.patient, professional=self.professional, start_datetime=start + timezone.timedelta(minutes=25), duration_minutes=50, time_range=(start + timezone.timedelta(minutes=25), end + timezone.timedelta(minutes=25)))
