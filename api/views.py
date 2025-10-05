from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer


from rest_framework import viewsets, permissions, status
from .models import Appointment
from .serializers import AppointmentSerializer
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "token": str(refresh.access_token)
        })




class IsOwnerOrProfessionalOrReadOnly(permissions.BasePermission):
    """Permite acceso si user es paciente propietario (patient) o professional involved, o admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        # allow owner patient to modify their appointment (for cancellation) and professional to mark completed
        return obj.patient == request.user or obj.professional == request.user




class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet que gestiona las citas entre pacientes y profesionales.
    Incluye validación de permisos y representación mejorada de datos.
    """
    queryset = Appointment.objects.all().select_related('patient', 'professional')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Appointment.objects.all().select_related('patient', 'professional')
        if getattr(user, 'role', None) == 'profesional':
            return Appointment.objects.filter(professional=user).select_related('patient', 'professional')
        return Appointment.objects.filter(patient=user).select_related('patient', 'professional')

    def perform_create(self, serializer):
        """
        Al crear una cita, el paciente se asigna automáticamente.
        Además, garantizamos que el rol del profesional se guarde correctamente.
        """
        appointment = serializer.save()
        if appointment.professional:
            appointment.professional_role = getattr(appointment.professional, 'role', 'desconocido')
            appointment.save(update_fields=['professional_role'])

    def create(self, request, *args, **kwargs):
        """
        Redefinimos create() para devolver información más útil tras crear la cita.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Reconsultamos el objeto recién creado para incluir datos del profesional/paciente
        appointment = serializer.instance
        response_data = AppointmentSerializer(appointment, context={'request': request}).data

        return Response(response_data, status=status.HTTP_201_CREATED)




class ProfesionalSearchView(generics.ListAPIView):
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['specialty']
    search_fields = ['username', 'specialty']
    ordering_fields = ['username']

    def get_queryset(self):
        queryset = CustomUser.objects.filter(role='profesional')
        available_only = self.request.query_params.get('available', None)
        if available_only == 'true':
            now = timezone.now()
            queryset = queryset.exclude(
                appointments_as_professional__start_datetime__lte=now,
                appointments_as_professional__end_datetime__gte=now,
                appointments_as_professional__status='scheduled'
            )
        return queryset.distinct()