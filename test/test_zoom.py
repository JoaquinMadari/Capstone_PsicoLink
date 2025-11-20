from django.test import TestCase
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone
from api.zoom_service import create_meeting_for_professional

class ZoomServiceLogicTests(TestCase):
    def setUp(self):
        self.profile_mock = MagicMock()
        self.profile_mock.user.email = "test@zoom.com"
        self.profile_mock.zoom_access_token = "old_token"
        # Token válido (expira en 1 hora)
        self.profile_mock.zoom_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    @patch('api.zoom_service.create_zoom_meeting')
    @patch('api.zoom_service.refresh_zoom_token')
    def test_retry_logic_on_401_error(self, mock_refresh, mock_create):
        """
        Prueba CRÍTICA: Si Zoom dice 'Error 401' (Token inválido),
        el sistema debe refrescar el token y reintentar automáticamente.
        """
        # Simulamos: 1er intento falla, 2do intento funciona
        mock_create.side_effect = [
            Exception("Token expirado o inválido"), 
            {"id": 888, "join_url": "url"}
        ]
        
        mock_refresh.return_value = "new_token"

        result = create_meeting_for_professional(self.profile_mock, "Topic", "Date")

        self.assertEqual(result['id'], 888)
        mock_refresh.assert_called_once() # ¡Se refrescó el token!
        self.assertEqual(mock_create.call_count, 2) # ¡Se intentó 2 veces!