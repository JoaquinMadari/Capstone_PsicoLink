from django.urls import path, include
from .views import ProfessionalDetailView, RegisterView, ProfileSetupView, AppointmentViewSet, ProfesionalSearchView, SpecialtyListView, LoginView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    ProfessionalDetailView, RegisterView, ProfileSetupView, AppointmentViewSet,
    ProfesionalSearchView, SpecialtyListView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import CustomTokenObtainPairSerializer
from .views_zoom import zoom_connect, zoom_callback

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointments')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),    
    path('auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('specialties/', SpecialtyListView.as_view(), name='specialty-list'),
    path('profile/setup/', ProfileSetupView.as_view(), name='profile_setup'), 
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('specialties/', SpecialtyListView.as_view(), name='specialty-list'),
    path('profile/setup/', ProfileSetupView.as_view(), name='profile_setup'),
    path('search/', ProfesionalSearchView.as_view(), name='profesional-search'),
    path('professionals/<int:user_id>/', ProfessionalDetailView.as_view(), name='professional-detail'),
    path("zoom/connect/", zoom_connect),
    path("zoom/oauth/callback/", zoom_callback),
]

