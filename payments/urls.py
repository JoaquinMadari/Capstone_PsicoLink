from django.urls import path
from .views import create_preference

urlpatterns = [
    path('create-preference/', create_preference),
]