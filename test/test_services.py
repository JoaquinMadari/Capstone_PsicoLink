from django.test import SimpleTestCase
from api.services import calcular_disponibilidad  # ejemplo de función que podría existir

class ServicesTest(SimpleTestCase):
    def test_calcular_disponibilidad(self):
        resultado = calcular_disponibilidad(professional_id=1, fecha='2025-10-10')
        self.assertIsInstance(resultado, list)