from django.test import TestCase
from django.contrib.auth import get_user_model
from api.serializers import RegisterSerializer, AppointmentSerializer
from api.models import Appointment
from django.utils import timezone

User = get_user_model()

class RegisterSerializerTest(TestCase):
    def test_register_serializer_valid(self):
        data = {'email':'test@test.com', 'password':'pass1234', 'role':'paciente'}
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.email, 'test@test.com')
        self.assertEqual(user.role, 'paciente')

class AppointmentSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.patient = User.objects.create_user(username='p2', email='p2@test.com', password='pass', role='paciente')
        cls.professional = User.objects.create_user(username='prof2', email='prof2@test.com', password='pass', role='profesional')

    def test_appointment_serializer_validation(self):
        start = timezone.now() + timezone.timedelta(hours=1)
        data = {
            'professional': self.professional.id,
            'start_datetime': start,
            'duration_minutes': 50
        }
        serializer = AppointmentSerializer(data=data, context={'request': self._mock_request()})
        self.assertTrue(serializer.is_valid())

    def _mock_request(self):
        class MockUser:
            is_authenticated = True
            id = 1
        class MockRequest:
            user = self.patient
        return MockRequest()
