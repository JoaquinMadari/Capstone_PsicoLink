from django.urls import path
from .views import create_preference, mercadopago_webhook

urlpatterns = [
    path('create-preference/', create_preference),
    path('webhook/', mercadopago_webhook, name='webhook'),
]