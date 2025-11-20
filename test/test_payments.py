from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch
from api.models import Appointment, PsicologoProfile, Specialty

User = get_user_model()

class PaymentTests(APITestCase):
    def setUp(self):
        self.patient = User.objects.create_user(email="paciente@pago.com", password="123", role="paciente")
        self.pro = User.objects.create_user(email="pro@pago.com", password="123", role="profesional")
        PsicologoProfile.objects.create(
            user=self.pro, rut="1-9", age=30, gender="X", nationality="CL", phone="123",
            specialty=Specialty.PSICOLOGIA_CLINICA, session_price=20000,
            zoom_access_token="token_ok" # Necesario para el test del webhook
        )
        self.url_pref = '/api/payments/create_preference/' 
        self.url_webhook = '/api/payments/webhook/'

    @patch('api.views_payments.sdk.preference') # Mock SDK MercadoPago
    def test_create_preference(self, mock_pref):
        self.client.force_authenticate(user=self.patient)
        
        # Simulamos respuesta de MP
        mock_pref.return_value.create.return_value = {
            "status": 201, "response": {"id": "pref_test", "init_point": "url"}
        }

        data = {"professional": self.pro.id, "start_datetime": "2025-12-01T10:00:00Z", "duration_minutes": 50, "modality": "Online"}
        resp = self.client.post(self.url_pref, data)
        
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['id'], "pref_test")

    @patch('api.views_payments.create_zoom_meeting_for_appointment') # Mock Zoom service
    @patch('api.views_payments.sdk.payment') # Mock SDK Payment Info
    def test_webhook_approved(self, mock_payment, mock_zoom):
        """Simula que MP avisa que pagaron. Debe crear la cita."""
        
        # Datos que MP "devuelve"
        metadata = {
            "patient": self.patient.id, "professional": self.pro.id,
            "start_datetime": "2025-12-01T10:00:00Z", "duration_minutes": 50,
            "modality": "Online", "professional_role": "psicologia_clinica"
        }
        
        mock_payment.return_value.get.return_value = {
            "status": 200, "response": {"status": "approved", "metadata": metadata}
        }

        payload = {"type": "payment", "data": {"id": "12345"}}
        resp = self.client.post(self.url_webhook, payload, format='json')
        
        self.assertEqual(resp.status_code, 200)
        # Verificamos que la cita existe en BD
        self.assertTrue(Appointment.objects.filter(patient=self.patient).exists())