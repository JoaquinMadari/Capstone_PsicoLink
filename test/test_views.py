from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from api.models import PsicologoProfile, Specialty

User = get_user_model()

class ViewsTests(APITestCase):
    def setUp(self):
        self.patient = User.objects.create_user(email="p_view@test.com", password="123", role="paciente")
        self.pro = User.objects.create_user(email="pro_view@test.com", password="123", role="profesional")
        
        # Perfil con token falso de Zoom
        PsicologoProfile.objects.create(
            user=self.pro, rut="1-9", age=30, gender="X", nationality="CL", phone="1",
            specialty=Specialty.PSICOLOGIA_CLINICA, work_modality="Online",
            zoom_access_token="fake_token"
        )

    @patch('api.views.ensure_supabase_user') # <--- MOCK SUPABASE
    def test_register_view(self, mock_supabase):
        # Simulamos que Supabase responde OK
        mock_supabase.return_value = "fake-uid-123"
        
        url = "/api/auth/register/" # O usa reverse('register') si tienes el name
        payload = {
            "email": "nuevo@api.com", "password": "123", "role": "paciente"
        }
        resp = self.client.post(url, payload)
        
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        mock_supabase.assert_called_once() # Confirmamos que se intentó llamar

    @patch('api.views.create_meeting_for_professional') # <--- MOCK ZOOM
    def test_create_appointment_view(self, mock_zoom):
        # Simulamos que Zoom responde OK con datos
        mock_zoom.return_value = {
            "id": "999", "join_url": "http://fake.zoom/j", "start_url": "http://fake.zoom/s"
        }
        
        self.client.force_authenticate(user=self.patient)
        
        url = "/api/appointments/"
        payload = {
            "professional": self.pro.id,
            "start_datetime": timezone.now() + timedelta(days=1),
            "duration_minutes": 50,
            "modality": "Online"
        }
        resp = self.client.post(url, payload)
        
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['zoom_meeting_id'], "999") # Verificamos que guardó lo del mock