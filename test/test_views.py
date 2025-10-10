from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterViewTest(APITestCase):
    def test_register(self):
        url = reverse('auth_register')
        data = {'email':'user@test.com', 'password':'pass1234', 'role':'paciente'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)