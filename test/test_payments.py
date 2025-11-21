from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
import json
from payments.views import create_zoom_meeting_for_appointment ,payments_views
from api.models import Appointment, PsicologoProfile, PacienteProfile, Specialty
from django.contrib.auth.models import User as DjangoUser
User = get_user_model()

class PaymentTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            email="paciente@pago.com", 
            password="123", 
            role="paciente",
            first_name="Paciente",
            last_name="Test"
        )
        self.pro = User.objects.create_user(
            email="pro@pago.com", 
            password="123", 
            role="profesional",
            first_name="Profesional",
            last_name="Test"
        )
        
        self.psicologo_profile = PsicologoProfile.objects.create(
            user=self.pro, 
            rut="1-9", 
            age=30, 
            gender="X", 
            nationality="CL", 
            phone="123",
            specialty=Specialty.PSICOLOGIA_CLINICA, 
            license_number="LIC123",
            main_focus="Ansiedad",
            therapeutic_techniques="TCC",
            style_of_attention="Individual",
            work_modality="Online",
            certificates="cert.pdf",
            session_price=20000,
            zoom_access_token="token_ok"
        )
        
        self.url_pref = '/api/payments/create_preference/' 
        self.url_webhook = '/api/payments/webhook/'

    # ----------------------------
    # Tests para Create Preference (EXPANDIDOS)
    # ----------------------------
    @patch('api.payments_views.sdk.preference')
    def test_create_preference_success(self, mock_pref):
        """Test exitoso para crear preferencia de pago"""
        self.client.force_authenticate(user=self.patient)
        
        # Mock de respuesta exitosa de MercadoPago
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {
                "id": "pref_test_123",
                "init_point": "https://mercadopago.com/checkout",
                "sandbox_init_point": "https://sandbox.mercadopago.com/checkout"
            }
        }

        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50, 
            "modality": "Online"
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['id'], "pref_test_123")
        self.assertIn("init_point", resp.data)

    @patch('api.payments_views.sdk.preference')
    def test_create_preference_with_professional_session_price(self, mock_pref):
        """Test que usa el session_price del profesional"""
        self.client.force_authenticate(user=self.patient)
        
        # Actualizar precio de sesión del profesional
        self.psicologo_profile.session_price = 35000
        self.psicologo_profile.save()
        
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {"id": "pref_test"}
        }

        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        
        # Verificar que se llamó a MercadoPago con el precio correcto
        call_args = mock_pref.return_value.create.call_args[0][0]
        self.assertEqual(call_args["items"][0]["unit_price"], 35000.0)
        self.assertEqual(resp.status_code, 200)

    @patch('api.payments_views.sdk.preference')
    def test_create_preference_fallback_session_price(self, mock_pref):
        """Test que usa precio por defecto cuando el profesional no tiene session_price"""
        self.client.force_authenticate(user=self.patient)
        
        # Remover session_price del profesional
        self.psicologo_profile.session_price = None
        self.psicologo_profile.save()
        
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {"id": "pref_test"}
        }

        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        
        # Verificar que se usó el precio por defecto (20000)
        call_args = mock_pref.return_value.create.call_args[0][0]
        self.assertEqual(call_args["items"][0]["unit_price"], 20000.0)
        self.assertEqual(resp.status_code, 200)

    def test_create_preference_unauthenticated(self):
        """Test que usuarios no autenticados no pueden crear preferencias"""
        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_preference_professional_not_found(self):
        """Test con profesional que no existe"""
        self.client.force_authenticate(user=self.patient)
        
        data = {
            "professional": 99999,  # ID que no existe
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        self.assertEqual(resp.status_code, 404)
        self.assertIn("error", resp.data)

    def test_create_preference_invalid_professional_role(self):
        """Test con usuario que no es profesional"""
        non_professional = User.objects.create_user(
            email="nopro@test.com", 
            password="123", 
            role="paciente"
        )
        
        self.client.force_authenticate(user=self.patient)
        
        data = {
            "professional": non_professional.id,  # No es profesional
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        self.assertEqual(resp.status_code, 404)

    @patch('api.payments_views.sdk.preference')
    def test_create_preference_mobile_platform(self, mock_pref):
        """Test para plataforma móvil (deep links)"""
        self.client.force_authenticate(user=self.patient)
        
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {"id": "pref_test"}
        }

        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        # Simular request desde móvil
        resp = self.client.post(
            self.url_pref, 
            data, 
            format='json',
            HTTP_X_PLATFORM='ios'
        )
        
        # Verificar que se usaron deep links para móvil
        call_args = mock_pref.return_value.create.call_args[0][0]
        self.assertIn("psicolink://", call_args["back_urls"]["success"])
        self.assertEqual(resp.status_code, 200)

    @patch('api.payments_views.sdk.preference')
    def test_create_preference_web_platform(self, mock_pref):
        """Test para plataforma web (URLs normales)"""
        self.client.force_authenticate(user=self.patient)
        
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {"id": "pref_test"}
        }

        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        # Simular request desde web (sin header X-Platform)
        resp = self.client.post(self.url_pref, data, format='json')
        
        # Verificar que se usaron URLs web normales
        call_args = mock_pref.return_value.create.call_args[0][0]
        self.assertIn("/exitoso", call_args["back_urls"]["success"])
        self.assertEqual(resp.status_code, 200)

    @patch('api.payments_views.sdk.preference')
    def test_create_preference_mercadopago_error(self, mock_pref):
        """Test cuando MercadoPago devuelve error"""
        self.client.force_authenticate(user=self.patient)
        
        # Mock de error de MercadoPago
        mock_pref.return_value.create.return_value = {
            "status": 400,
            "response": {"message": "Error en los parámetros"}
        }

        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = self.client.post(self.url_pref, data, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.data)

    # ----------------------------
    # Tests para Webhook (EXPANDIDOS)
    # ----------------------------
    @patch('payments.views.create_zoom_meeting_for_appointment')
    @patch('payments.views.sdk.payment')
    def test_webhook_approved_creates_appointment_and_zoom(self, mock_payment, mock_zoom):
        """Test que webhook approved crea cita y reunión Zoom"""
        # Mock de reunión Zoom exitosa
        mock_zoom.return_value = True
        
        # Datos que MP "devuelve" en el webhook
        metadata = {
            "patient": self.patient.id, 
            "professional": self.pro.id,
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50,
            "modality": "Online", 
            "professional_role": "psicologia_clinica",
            "session_price": 20000,
            "professional_name": "Profesional Test"
        }
        
        mock_payment.return_value.get.return_value = {
            "status": 200, 
            "response": {
                "status": "approved", 
                "metadata": metadata,
                "id": "12345"
            }
        }

        payload = {
            "type": "payment", 
            "data": {"id": "12345"}
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        
        self.assertEqual(resp.status_code, 200)
        
        # Verificar que la cita existe en BD
        appointment = Appointment.objects.filter(patient=self.patient).first()
        self.assertIsNotNone(appointment)
        self.assertEqual(appointment.status, "scheduled")
        self.assertEqual(appointment.modality, "Online")
        
        # Verificar que se intentó crear reunión Zoom
        mock_zoom.assert_called_once()

    @patch('api.payments_views.create_zoom_meeting_for_appointment')
    @patch('api.payments_views.sdk.payment')
    def test_webhook_approved_presencial_no_zoom(self, mock_payment, mock_zoom):
        """Test que webhook approved para cita presencial no crea Zoom"""
        # Datos para cita presencial
        metadata = {
            "patient": self.patient.id, 
            "professional": self.pro.id,
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50,
            "modality": "Presencial",  # Modalidad presencial
            "professional_role": "psicologia_clinica"
        }
        
        mock_payment.return_value.get.return_value = {
            "status": 200, 
            "response": {
                "status": "approved", 
                "metadata": metadata
            }
        }

        payload = {
            "type": "payment", 
            "data": {"id": "12345"}
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        
        self.assertEqual(resp.status_code, 200)
        
        # Verificar que la cita existe
        appointment = Appointment.objects.filter(patient=self.patient).first()
        self.assertIsNotNone(appointment)
        self.assertEqual(appointment.modality, "Presencial")
        
        # Verificar que NO se intentó crear reunión Zoom
        mock_zoom.assert_not_called()

    @patch('api.payments_views.sdk.payment')
    def test_webhook_payment_not_approved(self, mock_payment):
        """Test que webhook con payment no approved no crea cita"""
        metadata = {
            "patient": self.patient.id, 
            "professional": self.pro.id,
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50,
            "modality": "Online"
        }
        
        # Payment con status diferente a "approved"
        mock_payment.return_value.get.return_value = {
            "status": 200, 
            "response": {
                "status": "pending",  # No approved
                "metadata": metadata
            }
        }

        payload = {
            "type": "payment", 
            "data": {"id": "12345"}
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        
        self.assertEqual(resp.status_code, 200)
        
        # Verificar que NO se creó la cita
        appointment_exists = Appointment.objects.filter(patient=self.patient).exists()
        self.assertFalse(appointment_exists)

    @patch('api.payments_views.sdk.payment')
    def test_webhook_payment_not_found(self, mock_payment):
        """Test cuando el pago no se encuentra en MercadoPago"""
        mock_payment.return_value.get.return_value = {
            "status": 404,  # Pago no encontrado
            "response": {"message": "Payment not found"}
        }

        payload = {
            "type": "payment", 
            "data": {"id": "99999"}  # ID que no existe
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        self.assertEqual(resp.status_code, 404)
        self.assertIn("error", resp.data)

    def test_webhook_invalid_notification_type(self):
        """Test para notification type diferente de 'payment'"""
        payload = {
            "type": "subscription",  # Tipo no manejado
            "data": {"id": "12345"}
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn("ignored", resp.data)

    def test_webhook_missing_payment_id(self):
        """Test cuando falta el ID del pago"""
        payload = {
            "type": "payment",
            "data": {}  # Sin ID
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.data)

    @patch('api.payments_views.sdk.payment')
    def test_webhook_invalid_appointment_data(self, mock_payment):
        """Test cuando los datos de la cita son inválidos"""
        # Metadata con datos inválidos (falta professional)
        metadata = {
            "patient": self.patient.id,
            # professional faltante
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        mock_payment.return_value.get.return_value = {
            "status": 200, 
            "response": {
                "status": "approved", 
                "metadata": metadata
            }
        }

        payload = {
            "type": "payment", 
            "data": {"id": "12345"}
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn("errors", resp.data)

    # ----------------------------
    # Tests para Zoom Integration (EXPANDIDOS)
    # ----------------------------
    @patch('payments.views.create_meeting_for_professional')
    def test_create_zoom_meeting_success(self, mock_create_meeting):
        """Test exitoso para creación de reunión Zoom"""
        from payments.views import create_zoom_meeting_for_appointment
        
        # Crear cita de prueba
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.pro,
            start_datetime=timezone.now() + timedelta(hours=1),
            duration_minutes=50,
            modality="Online",
            professional_role="psicologia_clinica"
        )
        
        # Mock de creación exitosa de Zoom
        mock_create_meeting.return_value = {
            "id": "zoom_meeting_123",
            "join_url": "https://zoom.us/j/123",
            "start_url": "https://zoom.us/s/123"
        }
        
        result = create_zoom_meeting_for_appointment(appointment)
        
        self.assertTrue(result)
        mock_create_meeting.assert_called_once()
        
        # Verificar que se actualizaron los campos de Zoom
        appointment.refresh_from_db()
        self.assertEqual(appointment.zoom_meeting_id, "zoom_meeting_123")
        self.assertEqual(appointment.zoom_join_url, "https://zoom.us/j/123")

    def test_create_zoom_meeting_presencial_skip(self):
        """Test que salta creación de Zoom para citas presenciales"""
        from payments.views import create_zoom_meeting_for_appointment
        
        # Crear cita presencial
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.pro,
            start_datetime=timezone.now() + timedelta(hours=1),
            duration_minutes=50,
            modality="Presencial",  # No online
            professional_role="psicologia_clinica"
        )
        
        result = create_zoom_meeting_for_appointment(appointment)
        
        self.assertFalse(result)

    def test_create_zoom_meeting_already_has_zoom(self):
        """Test que salta creación si ya tiene Zoom"""
        from payments.views import create_zoom_meeting_for_appointment
        
        # Crear cita con Zoom ya asignado
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.pro,
            start_datetime=timezone.now() + timedelta(hours=1),
            duration_minutes=50,
            modality="Online",
            professional_role="psicologia_clinica",
            zoom_meeting_id="existing_zoom_id"
        )
        
        result = create_zoom_meeting_for_appointment(appointment)
        
        self.assertTrue(result)  # Devuelve True porque ya tiene Zoom

    @patch('api.payments_views.create_meeting_for_professional')
    def test_create_zoom_meeting_professional_no_zoom_token(self, mock_create_meeting):
        """Test que falla cuando el profesional no tiene token de Zoom"""
        from payments.views import create_zoom_meeting_for_appointment
        
        # Remover token de Zoom del profesional
        self.psicologo_profile.zoom_access_token = None
        self.psicologo_profile.save()
        
        # Crear cita
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.pro,
            start_datetime=timezone.now() + timedelta(hours=1),
            duration_minutes=50,
            modality="Online",
            professional_role="psicologia_clinica"
        )
        
        result = create_zoom_meeting_for_appointment(appointment)
        
        self.assertFalse(result)
        mock_create_meeting.assert_not_called()

    @patch('api.payments_views.create_meeting_for_professional')
    def test_create_zoom_meeting_zoom_error(self, mock_create_meeting):
        """Test que maneja errores de la API de Zoom"""
        from payments.views import create_zoom_meeting_for_appointment
        
        # Crear cita
        appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.pro,
            start_datetime=timezone.now() + timedelta(hours=1),
            duration_minutes=50,
            modality="Online",
            professional_role="psicologia_clinica"
        )
        
        # Mock de error en Zoom
        mock_create_meeting.return_value = None
        
        result = create_zoom_meeting_for_appointment(appointment)
        
        self.assertFalse(result)
        mock_create_meeting.assert_called_once()

    # ----------------------------
    # Tests de Integración Completa
    # ----------------------------
    @patch('payments.views.sdk.preference')
    @patch('payments.views.sdk.payment')
    @patch('payments.views.create_zoom_meeting_for_appointment')
    def test_complete_payment_flow(self, mock_zoom, mock_payment, mock_pref):
        """Test de flujo completo: preferencia -> pago -> webhook -> cita + Zoom"""
        # 1. Configurar mocks
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {"id": "pref_test"}
        }
        
        metadata = {
            "patient": self.patient.id, 
            "professional": self.pro.id,
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50,
            "modality": "Online", 
            "professional_role": "psicologia_clinica"
        }
        
        mock_payment.return_value.get.return_value = {
            "status": 200, 
            "response": {"status": "approved", "metadata": metadata}
        }
        
        mock_zoom.return_value = True

        # 2. Crear preferencia
        self.client.force_authenticate(user=self.patient)
        pref_data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50,
            "modality": "Online"
        }
        
        pref_resp = self.client.post(self.url_pref, pref_data, format='json')
        self.assertEqual(pref_resp.status_code, 200)

        # 3. Simular webhook de pago aprobado
        webhook_payload = {
            "type": "payment", 
            "data": {"id": "12345"}
        }
        
        webhook_resp = self.client.post(self.url_webhook, webhook_payload, format='json')
        self.assertEqual(webhook_resp.status_code, 200)

        # 4. Verificar que se creó la cita
        appointment = Appointment.objects.filter(patient=self.patient).first()
        self.assertIsNotNone(appointment)
        self.assertEqual(appointment.status, "scheduled")
        self.assertEqual(appointment.modality, "Online")

        # 5. Verificar que se intentó crear Zoom
        mock_zoom.assert_called_once()


# ----------------------------
# Tests para Edge Cases y Seguridad
# ----------------------------
class PaymentSecurityTests(APITestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            email="security@test.com", 
            password="123", 
            role="paciente"
        )
        self.pro = User.objects.create_user(
            email="pro_security@test.com", 
            password="123", 
            role="profesional"
        )
        
        PsicologoProfile.objects.create(
            user=self.pro, 
            rut="1-9", 
            age=30, 
            gender="X", 
            nationality="CL", 
            phone="123",
            specialty=Specialty.PSICOLOGIA_CLINICA, 
            session_price=20000
        )
        
        self.url_pref = '/api/payments/create_preference/' 
        self.url_webhook = '/api/payments/webhook/'

    @patch('api.payments_views.sdk.preference')
    def test_create_preference_csrf_exempt_webhook(self, mock_pref):
        """Test que webhook es CSRF exempt"""
        # El webhook debería funcionar sin token CSRF
        mock_pref.return_value.create.return_value = {
            "status": 201, 
            "response": {"id": "pref_test"}
        }

        # Usar client normal (no APIClient que maneja CSRF diferente)
        from django.test import Client
        client = Client()
        
        # Login para autenticación
        client.force_login(self.patient)
        
        data = {
            "professional": self.pro.id, 
            "start_datetime": "2025-12-01T10:00:00Z", 
            "duration_minutes": 50
        }
        
        resp = client.post(self.url_pref, data, content_type='application/json')
        self.assertEqual(resp.status_code, 200)

    def test_webhook_no_authentication_required(self):
        """Test que webhook no requiere autenticación"""
        # Webhook debería funcionar sin autenticación
        payload = {
            "type": "payment", 
            "data": {"id": "12345"}
        }
        
        resp = self.client.post(self.url_webhook, payload, format='json')
        # Puede devolver diferentes status según el payload, pero no 401/403
        self.assertNotIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])