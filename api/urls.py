from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    ProfessionalDetailView, RegisterView, ProfileSetupView, AppointmentViewSet,
    ProfesionalSearchView, SpecialtyListView, LoginView,
    SupportTicketCreateView, UserTicketListView, UserTicketDetailView, SupportTicketReplyView,
    AdminTicketListView, SupportTicketDetailView, AdminUserDetailView, AdminUserListView,
    ProfessionalAvailabilityView,AppointmentDetailWithHistoryAPIView,
    CloseAppointmentView, AppointmentNotesCreateView, AppointmentNotesListView
)
from .serializers import CustomTokenObtainPairSerializer
from .views_zoom import zoom_connect, zoom_callback
from .views import MyProfileView
router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointments')

urlpatterns = [
    path('appointments/<int:pk>/close/', CloseAppointmentView.as_view(), name='appointment-close'),
    path("appointments/<int:pk>/detail/", AppointmentDetailWithHistoryAPIView.as_view(), name="appointment-detail"),
    path("appointments/notes/create/", AppointmentNotesCreateView.as_view(), name="appointment-note-create"),
path("appointments/<int:appointment_id>/notes/", AppointmentNotesListView.as_view(), name="appointment-notes-list"),
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
    path("zoom/connect/", zoom_connect, name="zoom_connect"),
    path("zoom/oauth/callback/", zoom_callback, name="zoom_callback"),
    path('support/tickets/', SupportTicketCreateView.as_view(), name='create-support-ticket'),
    path('support/mis-tickets/', UserTicketListView.as_view(), name='user-ticket-list'),
    path('support/mis-tickets/<int:pk>/', UserTicketDetailView.as_view({'get': 'retrieve'}), name='user-ticket-detail'),
    path('support/tickets/<int:pk>/reply/', SupportTicketReplyView.as_view(), name='ticket-reply'),
    path('support/admin/tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='admin-ticket-detail'),
    path('support/admin/tickets/', AdminTicketListView.as_view(), name='admin-ticket-list'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('pro/profile/availability/', ProfessionalAvailabilityView.as_view(), name='pro-availability'),
    path("zoom/connect/", zoom_connect, name="zoom_connect"),
    path("zoom/oauth/callback/", zoom_callback, name="zoom_callback"),
    path('profile/me/', MyProfileView.as_view(), name='my_profile'),
]


