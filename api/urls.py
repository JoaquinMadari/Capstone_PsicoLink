from django.urls import path, include
from .views import ProfessionalDetailView, RegisterView, ProfileSetupView, AppointmentViewSet, ProfesionalSearchView, SpecialtyListView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .serializers import CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointments')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),    
    path('auth/login/', TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer), name='token_obtain_pair'),
    path('specialties/', SpecialtyListView.as_view(), name='specialty-list'),
    path('profile/setup/', ProfileSetupView.as_view(), name='profile_setup'), 
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('search/', ProfesionalSearchView.as_view(), name='profesional-search'),
    path('professionals/<int:user_id>/', ProfessionalDetailView.as_view(), name='professional-detail'),
]
